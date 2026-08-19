import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Image, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { haptic } from '@/lib/haptics';
import { createNoticeController, type NoticeController } from '@/lib/notice-controller';
import { trpc } from '@/lib/trpc';
import { useHistoryPersistence } from '@/hooks/use-history-persistence';
import { removeClipboardItems, updateClipboardItem, updateClipboardItems } from '@/lib/clipboard-item-mutations';
import { cleanupTemporaryFile } from '@/lib/temporary-file-cleanup';
import { cleanupManagedTemporaryFiles } from '@/lib/temporary-cache-cleanup';
import { createSingleFlight } from '@/lib/single-flight';
import { createHistoryRecoveryCoordinator } from '@/lib/history-recovery-coordinator';
import { createRecoveryFailureCounter } from '@/lib/recovery-failure-counter';
import { getLightboxPresentationState } from '@/lib/lightbox-presentation-state';
import { createLightboxOperationGuard } from '@/lib/lightbox-operation-guard';
import { isCurrentLightboxAction } from '@/lib/lightbox-async-state';

type Filter = 'All' | 'Text' | 'Images' | 'Favorites' | 'Work' | 'Personal';
type Category = 'Work' | 'Personal';
type Item = { id: string; type: 'text' | 'image'; content: string; imageData?: string; imageSize?: { width: number; height: number }; ocrText?: string; timestamp: number; favorite: boolean; category?: Category; source?: string };

const STORAGE_KEY = 'clipboard-manager-items';
const PREMIUM_KEY = 'clipboard-manager-premium';
const USAGE_KEY = 'clipboard-manager-usage';
const TELEMETRY_KEY = 'clipboard-manager-telemetry-enabled';
const initialItems: Item[] = [
  { id: '1', type: 'text', content: 'Design is not just what it looks like and feels like. Design is how it works.', timestamp: Date.now() - 1000 * 60 * 12, favorite: true, category: 'Work', source: 'Notes' },
  { id: '2', type: 'text', content: 'https://developer.apple.com/design/human-interface-guidelines/', timestamp: Date.now() - 1000 * 60 * 58, favorite: false, category: 'Work', source: 'Safari' },
  { id: '3', type: 'image', content: 'Screenshot from Photos', timestamp: Date.now() - 1000 * 60 * 60 * 3, favorite: false, source: 'Photos' },
  { id: '4', type: 'text', content: 'Remember to review the launch checklist before Friday.', timestamp: Date.now() - 1000 * 60 * 60 * 5, favorite: false, category: 'Personal', source: 'Reminders' },
  { id: '5', type: 'text', content: 'hello@northstar.studio', timestamp: Date.now() - 1000 * 60 * 60 * 24, favorite: true, category: 'Personal', source: 'Mail' },
];

type UsageState = { exportCount: number; ocrCount: number; periodStart: string };

async function trackUsage(kind: 'exportCount' | 'ocrCount') {
  try {
    const telemetryEnabled = await AsyncStorage.getItem(TELEMETRY_KEY);
    if (telemetryEnabled !== 'true') return;
    const saved = await AsyncStorage.getItem(USAGE_KEY);
    const parsed = saved ? JSON.parse(saved) as Partial<UsageState> : {};
    const next: UsageState = { exportCount: typeof parsed.exportCount === 'number' ? parsed.exportCount : 0, ocrCount: typeof parsed.ocrCount === 'number' ? parsed.ocrCount : 0, periodStart: typeof parsed.periodStart === 'string' ? parsed.periodStart : new Date().toISOString() };
    next[kind] += 1;
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(next));
  } catch { /* usage tracking is informational and must never block clipboard work */ }
}

function normalizeItems(value: unknown): Item[] {
  const items = Array.isArray(value) ? value as Item[] : [];
  return items
    .filter((item) => item && typeof item.id === 'string' && (item.type === 'text' || item.type === 'image') && typeof item.content === 'string')
    .map((item) => item.category ? item : { ...item, category: item.id === '1' || item.id === '2' ? 'Work' as Category : item.id === '4' || item.id === '5' ? 'Personal' as Category : undefined });
}

function formatTime(timestamp: number) {
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HistoryScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [notice, setNotice] = useState('');
  const noticeControllerRef = useRef<NoticeController | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [lightboxItem, setLightboxItem] = useState<Item | null>(null);
  const lightboxItemIdRef = useRef<string | null>(null);
  const lightboxSessionRef = useRef(0);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [ocrSaveFailures, setOcrSaveFailures] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [failedImageShareId, setFailedImageShareId] = useState<string | null>(null);
  const lightboxOperationGuardRef = useRef(createLightboxOperationGuard());
  const [isPremium, setIsPremium] = useState(false);
  const cacheCleanupFlightRef = useRef(createSingleFlight<number>());
  const recoveryFailureCounterRef = useRef(createRecoveryFailureCounter());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ocrMutation = trpc.ocr.extract.useMutation();
  if (!noticeControllerRef.current) noticeControllerRef.current = createNoticeController(setNotice);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREMIUM_KEY)
      .then((saved) => { if (active) setIsPremium(saved === 'true'); })
      .catch(() => { if (active) setIsPremium(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => { noticeControllerRef.current?.dispose(); }, []);
  const showNotice = useCallback((message: string) => {
    noticeControllerRef.current?.show(message);
  }, []);

  const { items, loadItems, persist } = useHistoryPersistence<Item>({
    storageKey: STORAGE_KEY,
    initialValue: initialItems,
    normalize: normalizeItems,
    onNotice: showNotice,
  });
  const runCacheCleanup = useCallback(() => {
    if (Platform.OS === 'web' || !FileSystem.cacheDirectory) return Promise.resolve(0);
    return cacheCleanupFlightRef.current.run(() => cleanupManagedTemporaryFiles(
      FileSystem.cacheDirectory!,
      (directory) => FileSystem.readDirectoryAsync(directory),
      (uri) => FileSystem.deleteAsync(uri, { idempotent: true }),
    ));
  }, []);
  const recoverAfterResume = useCallback(async () => {
    await runCacheCleanup();
    await loadItems();
    recoveryFailureCounterRef.current.reset();
    setRefreshError(false);
  }, [loadItems, runCacheCleanup]);
  const handleRecoveryFailure = useCallback(() => {
    if (recoveryFailureCounterRef.current.recordFailure() >= 3) {
      setRefreshError(true);
      showNotice('History recovery is still unavailable · pull to refresh to retry');
    }
  }, [showNotice]);
  const recoveryCoordinator = useMemo(
    () => createHistoryRecoveryCoordinator(recoverAfterResume),
    [recoverAfterResume],
  );
  useFocusEffect(useCallback(() => {
    void recoveryCoordinator.run().catch(() => { handleRecoveryFailure(); });
  }, [handleRecoveryFailure, recoveryCoordinator]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (nextState === 'active' && previousState !== 'active') void recoveryCoordinator.run().catch(() => { handleRecoveryFailure(); });
    });
    return () => subscription.remove();
  }, [handleRecoveryFailure, recoveryCoordinator]);
  useEffect(() => { setSelectedIds((current) => current.filter((id) => items.some((item) => item.id === id))); }, [items]);
  useEffect(() => {
    lightboxItemIdRef.current = lightboxItem?.id ?? null;
    lightboxSessionRef.current += 1;
  }, [lightboxItem]);

  const canApplyLightboxFeedback = (actionItemId: string, actionToken: number) => isCurrentLightboxAction({ activeItemId: lightboxItemIdRef.current, actionItemId, isVisible: lightboxItemIdRef.current !== null, actionToken, currentToken: lightboxSessionRef.current });

  const visibleItems = useMemo(() => items.filter((item) => {
    const searchableText = [item.content, item.ocrText, item.source, item.category, item.type === 'image' ? 'image' : 'text'].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = searchableText.includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Text' && item.type === 'text') || (filter === 'Images' && item.type === 'image') || (filter === 'Favorites' && item.favorite) || (filter === 'Work' && item.category === 'Work') || (filter === 'Personal' && item.category === 'Personal');
    return matchesQuery && matchesFilter;
  }), [items, query, filter]);

  const saveImageWithOcr = async (imageData: string, imageSize?: { width: number; height: number }, source = 'Clipboard') => {
    if (isSavingMedia || ocrMutation.isPending) return showNotice('Media processing is already in progress');
    if (imageData.length > 4_500_000) return showNotice('This image is too large to save locally');
    if (items.some((item) => item.type === 'image' && item.imageData === imageData)) return showNotice('That image is already in your history');
    setIsSavingMedia(true);
    const next: Item = { id: `${Date.now()}`, type: 'image', content: 'Image from clipboard', imageData, imageSize, timestamp: Date.now(), favorite: false, category: 'Personal', source };
    const saved = await persist([next, ...items]);
    if (!saved) { setIsSavingMedia(false); return; }
    haptic.success(); showNotice('Image saved · extracting text');
    try {
      const result = await ocrMutation.mutateAsync({ imageData });
      const updated = { ...next, ocrText: result.text || undefined };
      const metadataSaved = await persist([updated, ...items]);
      if (!metadataSaved) {
        setOcrSaveFailures((current) => current.includes(next.id) ? current : [...current, next.id]);
        showNotice('Image saved · extracted text could not be saved');
        return;
      }
      setOcrSaveFailures((current) => current.filter((id) => id !== next.id));
      void trackUsage('ocrCount');
      showNotice(result.text ? 'Image saved · text extracted' : 'Image saved · no text found');
    } catch { showNotice('Image saved · text extraction unavailable'); }
    finally { setIsSavingMedia(false); }
  };

  const retryOcr = async (item: Item) => {
    if (!item.imageData || ocrMutation.isPending) return;
    if (!lightboxOperationGuardRef.current.acquire('ocr')) {
      showNotice('Another image action is already in progress');
      return;
    }
    const actionToken = lightboxSessionRef.current;
    showNotice('Extracting text…');
    try {
      const result = await ocrMutation.mutateAsync({ imageData: item.imageData });
      const updated = items.map((candidate) => candidate.id === item.id ? { ...candidate, ocrText: result.text || undefined } : candidate);
      const metadataSaved = await persist(updated);
      if (!metadataSaved) {
        if (canApplyLightboxFeedback(item.id, actionToken)) {
          setOcrSaveFailures((current) => current.includes(item.id) ? current : [...current, item.id]);
          showNotice('Text extracted · could not save the updated image');
        }
        return;
      }
      setOcrSaveFailures((current) => current.filter((id) => id !== item.id));
      if (canApplyLightboxFeedback(item.id, actionToken)) {
        setLightboxItem(updated.find((candidate) => candidate.id === item.id) ?? item);
        showNotice(result.text ? 'Text extracted' : 'No readable text found');
      }
      void trackUsage('ocrCount');
    } catch {
      if (canApplyLightboxFeedback(item.id, actionToken)) showNotice('Text extraction failed · try again');
    }
    finally { lightboxOperationGuardRef.current.release('ocr'); }
  };

  const handleDrop = (event: any) => {
    if (Platform.OS !== 'web') return;
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file?.type?.startsWith('image/')) return showNotice('Drop an image file to save it');
    const reader = new FileReader();
    reader.onload = () => { const dataUrl = String(reader.result || ''); const imageData = dataUrl.split(',')[1]; if (imageData) void saveImageWithOcr(imageData, undefined, file.name || 'Dropped image'); };
    reader.readAsDataURL(file);
  };

  const pasteClipboard = async () => {
    if (isPasting || isSavingMedia) return;
    setIsPasting(true);
    try {
      const hasImage = await Clipboard.hasImageAsync();
      if (hasImage) {
        const image = await Clipboard.getImageAsync({ format: 'png' });
        if (image?.data) {
          const imageData = image.data.replace(/^data:image\/\w+;base64,/, '');
          await saveImageWithOcr(imageData, image.size); return;
        }
      }
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) return showNotice('Your clipboard is empty');
      const normalized = text.trim();
      if (items.some((item) => item.type === 'text' && item.content === normalized)) return showNotice('That item is already in your history');
      const next: Item = { id: `${Date.now()}`, type: 'text', content: normalized, timestamp: Date.now(), favorite: false, category: 'Personal', source: 'Clipboard' };
      persist([next, ...items]);
      haptic.success();
      showNotice('Saved to your clipboard history');
    } catch {
      haptic.error();
      showNotice('Could not access your clipboard');
    } finally {
      setIsPasting(false);
    }
  };

  const copyItem = async (item: Item) => {
    try {
      if (item.type === 'text') { await Clipboard.setStringAsync(item.content); haptic.success(); }
      else if (item.imageData) { await Clipboard.setImageAsync(item.imageData); haptic.success(); }
      else return showNotice('This image is no longer available');
      showNotice(item.type === 'image' ? 'Image copied to clipboard' : 'Copied to clipboard');
    } catch { haptic.error(); showNotice('Could not copy this item'); }
  };

  const toggleFavorite = async (id: string) => {
    const saved = await persist(updateClipboardItem(items, id, (item) => ({ ...item, favorite: !item.favorite })));
    if (saved) haptic.light();
  };
  const setCategory = async (id: string, category: Category) => {
    const saved = await persist(updateClipboardItem(items, id, (item) => ({ ...item, category })));
    if (saved) haptic.light();
  };
  const toggleSelection = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds([]); };
  const batchFavorite = async () => {
    if (!selectedIds.length) return showNotice('Select at least one item');
    const saved = await persist(updateClipboardItems(items, new Set(selectedIds), (item) => ({ ...item, favorite: true })));
    if (!saved) return;
    haptic.light();
    showNotice(`${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} added to favorites`);
    exitSelectionMode();
  };
  const batchCategory = () => {
    if (!selectedIds.length) return showNotice('Select at least one item');
    const selectedIdSet = new Set(selectedIds);
    const applyCategory = async (category: Category) => {
      const saved = await persist(updateClipboardItems(items, selectedIdSet, (item) => ({ ...item, category })));
      if (!saved) return;
      haptic.light();
      showNotice(`${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} moved to ${category}`);
      exitSelectionMode();
    };
    Alert.alert('Assign category', 'Choose a category for the selected items.', [
      { text: 'Work', onPress: () => applyCategory('Work') },
      { text: 'Personal', onPress: () => applyCategory('Personal') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const exportSelected = async () => {
    if (isExporting) return showNotice('Another share or export is already in progress');
    if (!isPremium) return showNotice('Batch export is a Clipboard Pro feature · your history remains free');
    if (!selectedIds.length) return showNotice('Select at least one item');
    const selected = items.filter((item) => selectedIds.includes(item.id));
    const exportText = selected.map((item, index) => `${index + 1}. ${item.type === 'image' ? '[Image]' : item.content}${item.ocrText ? `\nOCR: ${item.ocrText}` : ''}${item.category ? `\nCategory: ${item.category}` : ''}${item.source ? `\nSource: ${item.source}` : ''}`).join('\n\n');
    if (!lightboxOperationGuardRef.current.acquire('share')) {
      showNotice('Another image action is already in progress');
      return;
    }
    setIsExporting(true);
    let temporaryFileUri: string | null = null;
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(exportText);
        showNotice('Selected items copied as export text');
      } else {
        const fileUri = `${FileSystem.cacheDirectory}clipboard-export.txt`;
        temporaryFileUri = fileUri;
        await FileSystem.writeAsStringAsync(fileUri, exportText, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(fileUri, { dialogTitle: 'Share clipboard export', mimeType: 'text/plain' }); showNotice('Export ready to share'); }
        else { await Clipboard.setStringAsync(exportText); showNotice('Sharing unavailable; export copied to clipboard'); }
      }
      void trackUsage('exportCount');
      haptic.success();
      exitSelectionMode();
    } catch { haptic.error(); showNotice('Could not export selected items'); }
    finally {
      try {
        await cleanupTemporaryFile(temporaryFileUri, (uri) => FileSystem.deleteAsync(uri, { idempotent: true }));
      } finally {
        setIsExporting(false);
        lightboxOperationGuardRef.current.release('share');
      }
    }
  };
  const shareImageItem = async (item: Item) => {
    if (isExporting) return showNotice('Another share or export is already in progress');
    if (!item.imageData) return showNotice('This image is no longer available');
    if (!lightboxOperationGuardRef.current.acquire('share')) {
      showNotice('Another image action is already in progress');
      return;
    }
    setIsExporting(true);
    const actionToken = lightboxSessionRef.current;
    let temporaryFileUri: string | null = null;
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(item.ocrText ? `Image OCR text:\n${item.ocrText}` : 'Image saved in Clipboard Manager');
        if (canApplyLightboxFeedback(item.id, actionToken)) showNotice('Image context copied to clipboard');
      } else {
        const fileUri = `${FileSystem.cacheDirectory}clipboard-image-${item.id}.png`;
        temporaryFileUri = fileUri;
        await FileSystem.writeAsStringAsync(fileUri, item.imageData, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(fileUri, { dialogTitle: 'Share saved image', mimeType: 'image/png' }); if (canApplyLightboxFeedback(item.id, actionToken)) showNotice('Image ready to share'); }
        else { await Clipboard.setImageAsync(item.imageData); if (canApplyLightboxFeedback(item.id, actionToken)) showNotice('Sharing unavailable; image copied to clipboard'); }
      }
      if (canApplyLightboxFeedback(item.id, actionToken)) setFailedImageShareId(null);
      haptic.success();
    } catch {
      if (canApplyLightboxFeedback(item.id, actionToken)) {
        setFailedImageShareId(item.id);
        showNotice('Could not share this image · try again');
      }
      haptic.error();
    }
    finally {
      try {
        await cleanupTemporaryFile(temporaryFileUri, (uri) => FileSystem.deleteAsync(uri, { idempotent: true }));
      } finally {
        setIsExporting(false);
        lightboxOperationGuardRef.current.release('share');
      }
    }
  };
  const batchDelete = () => {
    if (!selectedIds.length) return showNotice('Select at least one item');
    Alert.alert('Delete selected items?', `${selectedIds.length} saved item${selectedIds.length === 1 ? '' : 's'} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const saved = await persist(removeClipboardItems(items, new Set(selectedIds)));
        if (!saved) return;
        haptic.medium();
        showNotice(`${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'} deleted`);
        exitSelectionMode();
      } },
    ]);
  };
  const clearAll = () => Alert.alert('Clear all history?', 'Every saved clipboard item will be removed.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear all', style: 'destructive', onPress: async () => {
      const saved = await persist([]);
      if (!saved) return;
      setSelectedItem(null);
      haptic.medium();
      showNotice('History cleared');
    } },
  ]);
  const deleteItem = async (id: string) => {
    const saved = await persist(removeClipboardItems(items, new Set([id])));
    if (saved) haptic.medium();
    return saved;
  };
  const deleteSelected = () => {
    if (!selectedItem) return;
    Alert.alert('Delete item?', 'This will remove it from your history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const saved = await deleteItem(selectedItem.id);
        if (!saved) return;
        setSelectedItem(null);
        showNotice('Item deleted');
      } },
    ]);
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await recoveryCoordinator.run();
      setRefreshError(false);
      setLastRefreshedAt(Date.now());
      showNotice('History refreshed');
    } catch {
      setRefreshError(true);
      showNotice('Could not refresh history');
    } finally {
      setRefreshing(false);
    }
  };

  const lightboxPresentation = getLightboxPresentationState({
    hasOcrText: Boolean(lightboxItem?.ocrText),
    hasOcrSaveFailure: Boolean(lightboxItem && ocrSaveFailures.includes(lightboxItem.id)),
    isSharing: isExporting,
    hasShareFailure: Boolean(lightboxItem && failedImageShareId === lightboxItem.id),
    isOcrPending: ocrMutation.isPending,
    hasImage: Boolean(lightboxItem?.imageData),
  });
  const lightboxVisibility = lightboxPresentation.visibility;
  const lightboxControls = lightboxItem ? lightboxPresentation.controls : null;

  return (
    <ScreenContainer {...(Platform.OS === 'web' ? { onDragOver: (event: any) => event.preventDefault(), onDrop: handleDrop } as any : {})} className="px-5" containerClassName="bg-[#F6F4F1]">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
          <Text style={styles.title}>Clipboard</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Settings tab" accessibilityHint="Shows where app preferences are located" style={({ pressed }) => [styles.settingsButton, pressed && styles.iconPressed]} onPress={() => router.push('/settings')}>
          <IconSymbol name="gearshape.fill" size={21} color="#56616B" />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>saved items</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={styles.summaryNumber}>{items.filter((item) => item.favorite).length}</Text><Text style={styles.summaryLabel}>favorites</Text></View>
        <View style={styles.summarySpacer} />
        <Pressable accessibilityRole="button" accessibilityLabel={isPasting ? 'Reading clipboard' : isSavingMedia ? 'Saving media' : 'Paste from clipboard'} accessibilityState={{ disabled: isPasting || isSavingMedia, busy: isPasting || isSavingMedia }} disabled={isPasting || isSavingMedia} style={({ pressed }) => [styles.pasteButton, (isPasting || isSavingMedia) && styles.pasteDisabled, pressed && !(isPasting || isSavingMedia) && styles.primaryPressed]} onPress={pasteClipboard}>{isPasting || isSavingMedia ? <ActivityIndicator size="small" color="#FFFFFF" /> : <IconSymbol name="plus" size={18} color="#FFFFFF" />}<Text style={styles.pasteText}>{isPasting ? 'Reading…' : isSavingMedia ? 'Saving…' : 'Paste'}</Text></Pressable>
      </View>

      <View style={styles.searchWrap}>
        <IconSymbol name="magnifyingglass" size={19} color="#8A949D" />
        <TextInput accessibilityLabel="Search clipboard history" value={query} onChangeText={setQuery} placeholder="Search your history" placeholderTextColor="#9AA3AA" style={styles.searchInput} returnKeyType="search" />
        {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}><IconSymbol name="xmark.circle.fill" size={18} color="#AAB2B7" /></Pressable>}
      </View>

      <View style={styles.chipsRow}>{(['All', 'Text', 'Images', 'Favorites'] as Filter[]).map((chip) => <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: filter === chip }} accessibilityLabel={`Filter by ${chip}`} onPress={() => setFilter(chip)} style={({ pressed }) => [styles.chip, filter === chip && styles.chipActive, pressed && styles.chipPressed]}><Text style={[styles.chipText, filter === chip && styles.chipTextActive]}>{chip}</Text></Pressable>)}</View><View style={styles.categoryRow}>{(['Work', 'Personal'] as Category[]).map((chip) => <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: filter === chip }} onPress={() => setFilter(chip)} style={({ pressed }) => [styles.categoryChip, filter === chip && styles.categoryChipActive, pressed && styles.chipPressed]}><Text style={[styles.categoryText, filter === chip && styles.categoryTextActive]}>{chip}</Text></Pressable>)}</View><Pressable accessibilityRole="button" accessibilityLabel="Open filters" accessibilityHint="Choose a clipboard type or category" style={({ pressed }) => [styles.filterSheetTrigger, pressed && styles.chipPressed]} onPress={() => setFilterSheetVisible(true)}><IconSymbol name="slider.horizontal.3" size={16} color="#C9553B" /><Text style={styles.filterSheetTriggerText}>{filter === 'All' ? 'More filters' : `Filter: ${filter}`}</Text><IconSymbol name="chevron.right" size={14} color="#C9553B" /></Pressable>{(query.trim() || filter !== 'All') ? <View style={styles.activeFilterSummary}><View style={styles.activeFilterDot} /><Text style={styles.activeFilterText}>{query.trim() ? `Searching “${query.trim()}”` : `${filter} items`} · {visibleItems.length} result{visibleItems.length === 1 ? '' : 's'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Clear active filters" onPress={() => { setQuery(''); setFilter('All'); }}><Text style={styles.activeFilterClear}>Clear</Text></Pressable></View> : null}
      {notice ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}><IconSymbol name="checkmark.circle.fill" size={17} color="#287A4B" /><Text style={styles.noticeText}>{notice}</Text></View> : null}
      {refreshError ? <View accessibilityRole="alert" style={styles.refreshError}><View style={styles.refreshErrorCopy}><IconSymbol name="exclamationmark.triangle.fill" size={16} color="#B4771F" /><Text style={styles.refreshErrorText}>History could not be refreshed.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Retry history refresh" onPress={() => void onRefresh()} disabled={refreshing}><Text style={styles.refreshRetryText}>{refreshing ? 'Retrying…' : 'Retry'}</Text></Pressable></View> : null}

      <View style={styles.listHeader}><View><Text style={styles.sectionTitle}>{selectionMode ? `${selectedIds.length} selected` : filter === 'All' ? 'Recent items' : filter}</Text>{lastRefreshedAt ? <Text style={styles.refreshMeta}>Updated {formatTime(lastRefreshedAt)}</Text> : null}</View><View style={styles.listHeaderRight}>{selectionMode ? <><Pressable accessibilityRole="button" accessibilityLabel="Favorite selected items" onPress={batchFavorite}><Text style={styles.clearText}>Favorite</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Assign category to selected items" onPress={batchCategory}><Text style={styles.countText}>Category</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={isExporting ? 'Exporting selected items' : 'Export selected items'} accessibilityState={{ busy: isExporting, disabled: isExporting }} disabled={isExporting} onPress={() => void exportSelected}><Text style={styles.countText}>{isExporting ? 'Exporting…' : isPremium ? 'Share' : 'Share · Pro'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete selected items" onPress={batchDelete}><Text style={styles.deleteText}>Delete</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Cancel selection" onPress={exitSelectionMode}><Text style={styles.countText}>Cancel</Text></Pressable></> : <><Text style={styles.countText}>{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}</Text>{items.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Select clipboard items" onPress={() => setSelectionMode(true)}><Text style={styles.countText}>Select</Text></Pressable> : null}{items.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Clear all clipboard history" onPress={clearAll}><Text style={styles.clearText}>Clear all</Text></Pressable> : null}</>}</View></View>
      <FlatList style={styles.listFlex} data={visibleItems} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E76F51" />} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><IconSymbol name={query.trim() || filter !== 'All' ? 'magnifyingglass' : 'doc.on.clipboard'} size={30} color="#E76F51" /></View><Text style={styles.emptyTitle}>{query.trim() || filter !== 'All' ? 'No matching items' : 'Nothing here yet'}</Text><Text style={styles.emptyCopy}>{query.trim() || filter !== 'All' ? 'Try a different search or filter to find another saved item.' : 'Paste something from your clipboard and it will appear in your history.'}</Text>{query.trim() || filter !== 'All' ? <Pressable style={styles.resetButton} onPress={() => { setQuery(''); setFilter('All'); }}><Text style={styles.resetText}>Reset search</Text></Pressable> : null}</View>} renderItem={({ item }) =>         <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedIds.includes(item.id) }} accessibilityHint={selectionMode ? 'Toggles item selection' : item.type === 'image' ? 'Opens a full-screen image preview' : 'Opens item details'} style={({ pressed }) => [styles.card, selectedIds.includes(item.id) && styles.cardSelected, pressed && styles.cardPressed]} onPress={() => selectionMode ? toggleSelection(item.id) : item.type === 'image' && item.imageData ? setLightboxItem(item) : setSelectedItem(item)}>
        <View style={styles.cardLeft}>{selectionMode ? <View style={[styles.selectionCircle, selectedIds.includes(item.id) && styles.selectionCircleActive]}><Text style={styles.selectionMark}>{selectedIds.includes(item.id) ? '✓' : ''}</Text></View> : <View style={[styles.typeIcon, item.type === 'image' && styles.imageIcon]}><IconSymbol name={item.type === 'image' ? 'photo' : 'doc.text'} size={20} color={item.type === 'image' ? '#8063A6' : '#E76F51'} /></View>}</View>
        <View style={styles.cardBody}><View style={styles.metaRow}><View style={styles.metaContent}><Text style={styles.meta}>{item.source || 'Clipboard'} · {formatTime(item.timestamp)}</Text>{item.category ? <View style={[styles.categoryBadge, item.category === 'Work' ? styles.workBadge : styles.personalBadge]}><Text style={[styles.categoryBadgeText, item.category === 'Work' ? styles.workText : styles.personalText]}>{item.category}</Text></View> : null}</View><Pressable accessibilityRole="button" accessibilityLabel={item.favorite ? 'Remove from favorites' : 'Add to favorites'} accessibilityState={{ selected: item.favorite }} onPress={() => toggleFavorite(item.id)} hitSlop={8}><IconSymbol name={item.favorite ? 'star.fill' : 'star'} size={19} color={item.favorite ? '#E9A23B' : '#AEB5B9'} /></Pressable></View><Text numberOfLines={3} style={styles.content}>{item.type === 'image' && item.ocrText ? item.ocrText : item.content}</Text>{item.type === 'image' ? <Text style={styles.imageHint}>{item.ocrText ? 'Extracted text · tap to preview' : ocrSaveFailures.includes(item.id) ? 'Text ready · tap to retry saving OCR' : 'Tap to preview image · text not extracted yet'}</Text> : null}<View style={styles.cardActions}><Pressable accessibilityRole="button" accessibilityLabel={item.type === 'image' ? 'Copy image to clipboard' : 'Copy text to clipboard'} style={({ pressed }) => [styles.copyAction, pressed && styles.actionPressed]} onPress={() => copyItem(item)}><IconSymbol name="doc.on.doc" size={15} color="#E76F51" /><Text style={styles.copyText}>Copy</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete clipboard item" style={({ pressed }) => [styles.deleteAction, pressed && styles.actionPressed]} onPress={() => Alert.alert('Delete item?', 'This will remove it from your history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) }])}><Text style={styles.deleteText}>Delete</Text></Pressable></View></View>
      </Pressable>} />
      <Modal visible={filterSheetVisible} animationType="slide" transparent onRequestClose={() => setFilterSheetVisible(false)}>
        <View style={styles.filterSheetBackdrop}><View style={styles.filterSheetCard}>
          <View style={styles.filterSheetHeader}><Text style={styles.filterSheetTitle}>Filter history</Text><Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={() => setFilterSheetVisible(false)}><IconSymbol name="xmark.circle.fill" size={24} color="#9AA3AA" /></Pressable></View>
          <Text style={styles.filterSheetCopy}>Narrow your clipboard history by content type or category.</Text>
          <Text style={styles.filterSheetSection}>CONTENT TYPE</Text><View style={styles.filterSheetOptions}>{(['All', 'Text', 'Images', 'Favorites'] as Filter[]).map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: filter === option }} style={[styles.filterSheetOption, filter === option && styles.filterSheetOptionActive]} onPress={() => setFilter(option)}><Text style={[styles.filterSheetOptionText, filter === option && styles.filterSheetOptionTextActive]}>{option}</Text></Pressable>)}</View>
          <Text style={styles.filterSheetSection}>CATEGORY</Text><View style={styles.filterSheetOptions}>{(['Work', 'Personal'] as Category[]).map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: filter === option }} style={[styles.filterSheetOption, filter === option && styles.filterSheetOptionActive]} onPress={() => setFilter(option)}><Text style={[styles.filterSheetOptionText, filter === option && styles.filterSheetOptionTextActive]}>{option}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all filters" style={styles.modalDanger} onPress={() => { setFilter('All'); setQuery(''); setFilterSheetVisible(false); }}><Text style={styles.modalDangerText}>Clear all filters</Text></Pressable>
        </View></View>
      </Modal>
      <Modal visible={selectedItem !== null} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Clipboard item</Text><Pressable onPress={() => setSelectedItem(null)}><IconSymbol name="xmark.circle.fill" size={24} color="#9AA3AA" /></Pressable></View>
          {selectedItem ? <><Text style={styles.modalMeta}>{selectedItem.source || 'Clipboard'} · {formatTime(selectedItem.timestamp)}</Text><Text style={styles.modalContent}>{selectedItem.content}</Text>{selectedItem.ocrText ? <><Text style={styles.categoryLabel}>EXTRACTED TEXT</Text><Text style={styles.ocrText}>{selectedItem.ocrText}</Text></> : null}<Text style={styles.categoryLabel}>CATEGORY</Text><View style={styles.modalCategoryRow}>{(['Work', 'Personal'] as Category[]).map((category) => <Pressable key={category} onPress={() => { setCategory(selectedItem.id, category); setSelectedItem({ ...selectedItem, category }); showNotice(`${category} category saved`); }} style={[styles.modalCategory, selectedItem.category === category && styles.modalCategoryActive]}><Text style={[styles.modalCategoryText, selectedItem.category === category && styles.modalCategoryTextActive]}>{category}</Text></Pressable>)}</View><View style={styles.modalActions}><Pressable style={styles.modalPrimary} onPress={() => { copyItem(selectedItem); setSelectedItem(null); }}><IconSymbol name="doc.on.doc" size={17} color="#FFFFFF" /><Text style={styles.modalPrimaryText}>Copy to clipboard</Text></Pressable><Pressable style={styles.modalSecondary} onPress={() => { toggleFavorite(selectedItem.id); setSelectedItem({ ...selectedItem, favorite: !selectedItem.favorite }); showNotice(selectedItem.favorite ? 'Removed from favorites' : 'Added to favorites'); }}><IconSymbol name={selectedItem.favorite ? 'star.fill' : 'star'} size={17} color="#E76F51" /><Text style={styles.modalSecondaryText}>{selectedItem.favorite ? 'Unfavorite' : 'Favorite'}</Text></Pressable><Pressable style={styles.modalDanger} onPress={deleteSelected}><IconSymbol name="xmark" size={17} color="#C9553B" /><Text style={styles.modalDangerText}>Delete item</Text></Pressable></View></> : null}
        </View></View>
      </Modal>
      <Modal visible={lightboxVisibility.visible} animationType="fade" transparent onRequestClose={() => setLightboxItem(null)}>
        <View style={styles.lightboxBackdrop} accessibilityViewIsModal><Pressable accessibilityRole="button" accessibilityLabel={lightboxVisibility.closeLabel} accessibilityHint="Dismisses the full-screen image preview" style={[styles.lightboxClose, { top: insets.top + 12 }]} onPress={() => setLightboxItem(null)}><Text style={styles.lightboxCloseText}>Close</Text></Pressable>{lightboxItem?.imageData ? <Image resizeMode="contain" style={styles.lightboxImage} source={{ uri: `data:image/png;base64,${lightboxItem.imageData}` }} /> : <ActivityIndicator color="#FFFFFF" />}{lightboxItem ? <View style={styles.lightboxInfo}><Text style={styles.lightboxInfoTitle}>{lightboxItem.ocrText ? 'Extracted text' : 'No extracted text yet'}</Text>{lightboxItem.ocrText ? <Text style={styles.lightboxInfoText}>{lightboxItem.ocrText}</Text> : null}{lightboxItem.imageSize ? <Text style={styles.lightboxInfoMeta}>{lightboxItem.imageSize.width} × {lightboxItem.imageSize.height}px</Text> : null}{lightboxControls ? <Pressable accessibilityRole="button" accessibilityLabel={lightboxControls.share.accessibilityLabel} accessibilityHint="Shares the saved image or copies its context when sharing is unavailable" accessibilityState={{ busy: lightboxControls.share.busy, disabled: lightboxControls.share.disabled }} disabled={lightboxControls.share.disabled} style={({ pressed }) => [styles.lightboxShareButton, pressed && styles.primaryPressed]} onPress={() => void shareImageItem(lightboxItem)}><Text style={styles.lightboxShareText}>{lightboxControls.share.label}</Text></Pressable> : null}</View> : null}{lightboxItem && lightboxControls?.ocrVisible && lightboxControls ? <Pressable accessibilityRole="button" accessibilityLabel={lightboxControls.ocr.accessibilityLabel} accessibilityHint="Extracts text from the saved image and saves it with the item" accessibilityState={{ busy: lightboxControls.ocr.busy, disabled: lightboxControls.ocr.disabled }} disabled={lightboxControls.ocr.disabled} style={({ pressed }) => [styles.ocrRetryButton, { bottom: insets.bottom + 18 }, pressed && styles.primaryPressed]} onPress={() => void retryOcr(lightboxItem)}><Text style={styles.ocrRetryText}>{lightboxControls.ocr.label}</Text></Pressable> : null}</View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  eyebrow: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: '#1F2933', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  settingsButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E4DF' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFCF8', borderRadius: 18, borderWidth: 1, borderColor: '#EFE6DE', paddingHorizontal: 13, paddingVertical: 11, marginBottom: 20 },
  summaryNumber: { color: '#1F2933', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }, summaryLabel: { color: '#8A949D', fontSize: 11, marginTop: 2, fontWeight: '600' }, summaryDivider: { height: 28, width: 1, backgroundColor: '#DDD8D2', marginHorizontal: 18 }, summarySpacer: { flex: 1 },
  pasteButton: { backgroundColor: '#E76F51', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, pasteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  searchWrap: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DF', height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 }, searchInput: { flex: 1, color: '#1F2933', fontSize: 15 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 8 }, categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 13 }, categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 11, backgroundColor: '#EDEAE6' }, categoryChipActive: { backgroundColor: '#E7DDF5' }, categoryText: { color: '#8A949D', fontSize: 12, fontWeight: '700' }, categoryTextActive: { color: '#8063A6' }, chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 13, backgroundColor: '#ECE9E5' }, chipActive: { backgroundColor: '#FCE5DE' }, chipText: { color: '#7B8794', fontSize: 13, fontWeight: '700' }, chipTextActive: { color: '#C9553B' },
  filterSheetTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFF9F5', borderRadius: 12, borderWidth: 1, borderColor: '#F3DED4', paddingVertical: 9, marginBottom: 10 }, filterSheetTriggerText: { color: '#C9553B', fontSize: 12, fontWeight: '800' }, activeFilterSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9F5', borderRadius: 12, borderWidth: 1, borderColor: '#F3DED4', paddingHorizontal: 11, paddingVertical: 9, marginBottom: 12 }, activeFilterDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E76F51', marginRight: 8 }, activeFilterText: { flex: 1, color: '#7B5D52', fontSize: 12, fontWeight: '700' }, activeFilterClear: { color: '#C9553B', fontSize: 12, fontWeight: '800', marginLeft: 8 }, notice: { backgroundColor: '#DDF3E4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }, noticeText: { color: '#287A4B', fontSize: 13, fontWeight: '700' }, refreshError: { backgroundColor: '#FFF4D9', borderRadius: 12, borderWidth: 1, borderColor: '#F1D99B', paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, refreshErrorCopy: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }, refreshErrorText: { color: '#8A641F', fontSize: 12, fontWeight: '700' }, refreshRetryText: { color: '#8A641F', fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4 },
  listFlex: { flex: 1, minHeight: 0 }, listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, minHeight: 28 }, listHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 }, clearText: { color: '#C9553B', fontSize: 12, fontWeight: '800' }, sectionTitle: { color: '#1F2933', fontSize: 18, fontWeight: '800' }, refreshMeta: { color: '#9AA3AA', fontSize: 10, fontWeight: '600', marginTop: 2 }, countText: { color: '#98A1A7', fontSize: 12, fontWeight: '600' }, listContent: { paddingBottom: 32, gap: 10 },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.995 }] }, cardSelected: { borderColor: '#E76F51', borderWidth: 2 }, selectionCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#D5D9DC', alignItems: 'center', justifyContent: 'center' }, selectionCircleActive: { backgroundColor: '#E76F51', borderColor: '#E76F51' }, selectionMark: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 }, iconPressed: { opacity: 0.68 }, primaryPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, pasteDisabled: { opacity: 0.58 }, chipPressed: { opacity: 0.72 }, actionPressed: { opacity: 0.62 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, width: '100%', minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E8E4DF', elevation: 1, overflow: 'hidden' }, cardLeft: { width: 38, marginRight: 12 }, typeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FCE5DE', alignItems: 'center', justifyContent: 'center' }, imageIcon: { backgroundColor: '#E8DFF5' }, cardBody: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%', alignSelf: 'stretch' }, metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, metaContent: { flexDirection: 'row', alignItems: 'center', gap: 7, flexGrow: 1, flexShrink: 1, minWidth: 0 }, categoryBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }, workBadge: { backgroundColor: '#E7DDF5' }, personalBadge: { backgroundColor: '#FFF3D9' }, categoryBadgeText: { fontSize: 9, fontWeight: '800' }, workText: { color: '#8063A6' }, personalText: { color: '#B4771F' }, meta: { color: '#9AA3AA', fontSize: 11, fontWeight: '600', flexShrink: 1 }, content: { color: '#29343D', fontSize: 15, lineHeight: 21, fontWeight: '500', flexShrink: 1, maxWidth: '100%' }, imageHint: { color: '#9AA3AA', fontSize: 11, marginTop: 5, fontWeight: '600', flexShrink: 1, maxWidth: '100%' }, cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 15 }, copyAction: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF4F0', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 }, copyText: { color: '#E76F51', fontSize: 13, fontWeight: '800' }, deleteAction: { paddingHorizontal: 7, paddingVertical: 6, borderRadius: 10 }, deleteText: { color: '#A7AFB4', fontSize: 13, fontWeight: '700' },
  lightboxBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,28,0.96)', alignItems: 'center', justifyContent: 'center', padding: 20 }, lightboxInfo: { position: 'absolute', left: 20, right: 20, bottom: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12 }, lightboxInfoTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, lightboxInfoText: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, marginTop: 5 }, lightboxInfoMeta: { color: '#B9C0C4', fontSize: 11, marginTop: 6 }, lightboxShareButton: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#E76F51', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 }, lightboxShareText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' }, lightboxImage: { width: '100%', height: '80%' }, lightboxClose: { position: 'absolute', top: 58, right: 20, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }, lightboxCloseText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, ocrRetryButton: { position: 'absolute', backgroundColor: '#E76F51', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11 }, ocrRetryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, ocrText: { color: '#29343D', backgroundColor: '#F6F4F1', borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20 }, filterSheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31,41,51,0.28)' }, filterSheetCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34 }, filterSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, filterSheetTitle: { color: '#1F2933', fontSize: 20, fontWeight: '800' }, filterSheetCopy: { color: '#8A949D', fontSize: 13, lineHeight: 19, marginBottom: 18 }, filterSheetSection: { color: '#9AA3AA', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 9, marginBottom: 8 }, filterSheetOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, filterSheetOption: { borderWidth: 1, borderColor: '#E8E4DF', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 }, filterSheetOptionActive: { backgroundColor: '#FCE5DE', borderColor: '#F1C3B7' }, filterSheetOptionText: { color: '#7B8794', fontSize: 13, fontWeight: '700' }, filterSheetOptionTextActive: { color: '#C9553B' }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31,41,51,0.28)' }, modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { color: '#1F2933', fontSize: 20, fontWeight: '800' }, modalMeta: { color: '#9AA3AA', fontSize: 12, fontWeight: '700', marginTop: 16 }, categoryLabel: { color: '#9AA3AA', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 20, marginBottom: 8 }, modalCategoryRow: { flexDirection: 'row', gap: 8 }, modalCategory: { borderWidth: 1, borderColor: '#E8E4DF', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 8 }, modalCategoryActive: { backgroundColor: '#E7DDF5', borderColor: '#C8B5E0' }, modalCategoryText: { color: '#7B8794', fontSize: 12, fontWeight: '700' }, modalCategoryTextActive: { color: '#8063A6' }, modalContent: { color: '#29343D', fontSize: 17, lineHeight: 25, marginTop: 10, minHeight: 90 }, modalActions: { gap: 10, marginTop: 20 }, modalPrimary: { backgroundColor: '#E76F51', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }, modalSecondary: { borderWidth: 1, borderColor: '#F1C3B7', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalSecondaryText: { color: '#C9553B', fontWeight: '800', fontSize: 14 }, modalDanger: { height: 46, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalDangerText: { color: '#C9553B', fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 36 }, resetButton: { backgroundColor: '#FCE5DE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 16 }, resetText: { color: '#C9553B', fontSize: 13, fontWeight: '800' }, emptyIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#FCE5DE', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, emptyTitle: { color: '#29343D', fontSize: 18, fontWeight: '800', marginBottom: 7 }, emptyCopy: { color: '#8A949D', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
