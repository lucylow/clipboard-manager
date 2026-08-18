import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { haptic } from '@/lib/haptics';
import { trpc } from '@/lib/trpc';

type Filter = 'All' | 'Text' | 'Images' | 'Favorites' | 'Work' | 'Personal';
type Category = 'Work' | 'Personal';
type Item = { id: string; type: 'text' | 'image'; content: string; imageData?: string; imageSize?: { width: number; height: number }; ocrText?: string; timestamp: number; favorite: boolean; category?: Category; source?: string };

const STORAGE_KEY = 'clipboard-manager-items';
const initialItems: Item[] = [
  { id: '1', type: 'text', content: 'Design is not just what it looks like and feels like. Design is how it works.', timestamp: Date.now() - 1000 * 60 * 12, favorite: true, category: 'Work', source: 'Notes' },
  { id: '2', type: 'text', content: 'https://developer.apple.com/design/human-interface-guidelines/', timestamp: Date.now() - 1000 * 60 * 58, favorite: false, category: 'Work', source: 'Safari' },
  { id: '3', type: 'image', content: 'Screenshot from Photos', timestamp: Date.now() - 1000 * 60 * 60 * 3, favorite: false, source: 'Photos' },
  { id: '4', type: 'text', content: 'Remember to review the launch checklist before Friday.', timestamp: Date.now() - 1000 * 60 * 60 * 5, favorite: false, category: 'Personal', source: 'Reminders' },
  { id: '5', type: 'text', content: 'hello@northstar.studio', timestamp: Date.now() - 1000 * 60 * 60 * 24, favorite: true, category: 'Personal', source: 'Mail' },
];

function normalizeItems(items: Item[]) { return items.filter((item) => item && typeof item.id === 'string' && (item.type === 'text' || item.type === 'image') && typeof item.content === 'string').map((item) => item.category ? item : { ...item, category: item.id === '1' || item.id === '2' ? 'Work' as Category : item.id === '4' || item.id === '5' ? 'Personal' as Category : undefined }); }

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
  const [items, setItems] = useState<Item[]>(initialItems);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [lightboxItem, setLightboxItem] = useState<Item | null>(null);
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const insets = useSafeAreaInsets();
  const ocrMutation = trpc.ocr.extract.useMutation();

  const loadItems = useCallback(async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) { const normalized = normalizeItems(JSON.parse(saved)); setItems(normalized); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); }
    else { setItems(initialItems); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialItems)); }
  }, []);
  useEffect(() => { void loadItems(); }, [loadItems]);
  useFocusEffect(useCallback(() => { void loadItems(); }, [loadItems]));

  const persist = (next: Item[]) => {
    setItems(next);
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visibleItems = useMemo(() => items.filter((item) => {
    const searchableText = [item.content, item.ocrText, item.source, item.category, item.type === 'image' ? 'image' : 'text'].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = searchableText.includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Text' && item.type === 'text') || (filter === 'Images' && item.type === 'image') || (filter === 'Favorites' && item.favorite) || (filter === 'Work' && item.category === 'Work') || (filter === 'Personal' && item.category === 'Personal');
    return matchesQuery && matchesFilter;
  }), [items, query, filter]);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2200);
  };

  const saveImageWithOcr = async (imageData: string, imageSize?: { width: number; height: number }, source = 'Clipboard') => {
    if (isSavingMedia || ocrMutation.isPending) return showNotice('Media processing is already in progress');
    if (imageData.length > 4_500_000) return showNotice('This image is too large to save locally');
    setIsSavingMedia(true);
    if (items.some((item) => item.type === 'image' && item.imageData === imageData)) return showNotice('That image is already in your history');
    const next: Item = { id: `${Date.now()}`, type: 'image', content: 'Image from clipboard', imageData, imageSize, timestamp: Date.now(), favorite: false, category: 'Personal', source };
    try { await persist([next, ...items]); } catch { setItems(items); setIsSavingMedia(false); return showNotice('Could not save this image'); }
    haptic.success(); showNotice('Image saved · extracting text');
    try {
      const result = await ocrMutation.mutateAsync({ imageData });
      const updated = { ...next, ocrText: result.text || undefined };
      persist([updated, ...items]);
      showNotice(result.text ? 'Image saved · text extracted' : 'Image saved · no text found');
    } catch { showNotice('Image saved · text extraction unavailable'); }
    finally { setIsSavingMedia(false); }
  };

  const retryOcr = async (item: Item) => {
    if (!item.imageData || ocrMutation.isPending) return;
    showNotice('Extracting text…');
    try {
      const result = await ocrMutation.mutateAsync({ imageData: item.imageData });
      const updated = items.map((candidate) => candidate.id === item.id ? { ...candidate, ocrText: result.text || undefined } : candidate);
      await persist(updated);
      setLightboxItem(updated.find((candidate) => candidate.id === item.id) ?? item);
      showNotice(result.text ? 'Text extracted' : 'No readable text found');
    } catch { showNotice('Text extraction failed · try again'); }
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

  const toggleFavorite = (id: string) => { haptic.light(); persist(items.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item)); };
  const setCategory = (id: string, category: Category) => { haptic.light(); persist(items.map((item) => item.id === id ? { ...item, category } : item)); };
  const clearAll = () => Alert.alert('Clear all history?', 'Every saved clipboard item will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear all', style: 'destructive', onPress: () => { persist([]); setSelectedItem(null); haptic.medium(); showNotice('History cleared'); } }]);
  const deleteItem = (id: string) => { haptic.medium(); persist(items.filter((item) => item.id !== id)); };
  const deleteSelected = () => {
    if (!selectedItem) return;
    Alert.alert('Delete item?', 'This will remove it from your history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { deleteItem(selectedItem.id); setSelectedItem(null); showNotice('Item deleted'); } }]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  return (
    <ScreenContainer {...(Platform.OS === 'web' ? { onDragOver: (event: any) => event.preventDefault(), onDrop: handleDrop } as any : {})} className="px-5" containerClassName="bg-[#F6F4F1]">
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
          <Text style={styles.title}>Clipboard</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Settings tab" accessibilityHint="Shows where app preferences are located" style={({ pressed }) => [styles.settingsButton, pressed && styles.iconPressed]} onPress={() => showNotice('Settings are available in the Settings tab')}>
          <IconSymbol name="gearshape.fill" size={21} color="#56616B" />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>saved items</Text></View>
        <View style={styles.summaryDivider} />
        <View><Text style={styles.summaryNumber}>{items.filter((item) => item.favorite).length}</Text><Text style={styles.summaryLabel}>favorites</Text></View>
        <View style={styles.summarySpacer} />
        <Pressable accessibilityRole="button" accessibilityLabel={isSavingMedia ? 'Saving media' : 'Paste from clipboard'} accessibilityState={{ disabled: isSavingMedia, busy: isSavingMedia }} disabled={isSavingMedia} style={({ pressed }) => [styles.pasteButton, isSavingMedia && styles.pasteDisabled, pressed && !isSavingMedia && styles.primaryPressed]} onPress={pasteClipboard}><IconSymbol name="plus" size={18} color="#FFFFFF" /><Text style={styles.pasteText}>{isSavingMedia ? 'Saving…' : 'Paste'}</Text></Pressable>
      </View>

      <View style={styles.searchWrap}>
        <IconSymbol name="magnifyingglass" size={19} color="#8A949D" />
        <TextInput accessibilityLabel="Search clipboard history" value={query} onChangeText={setQuery} placeholder="Search your history" placeholderTextColor="#9AA3AA" style={styles.searchInput} returnKeyType="search" />
        {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}><IconSymbol name="xmark.circle.fill" size={18} color="#AAB2B7" /></Pressable>}
      </View>

      <View style={styles.chipsRow}>{(['All', 'Text', 'Images', 'Favorites'] as Filter[]).map((chip) => <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: filter === chip }} accessibilityLabel={`Filter by ${chip}`} onPress={() => setFilter(chip)} style={({ pressed }) => [styles.chip, filter === chip && styles.chipActive, pressed && styles.chipPressed]}><Text style={[styles.chipText, filter === chip && styles.chipTextActive]}>{chip}</Text></Pressable>)}</View><View style={styles.categoryRow}>{(['Work', 'Personal'] as Category[]).map((chip) => <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: filter === chip }} onPress={() => setFilter(chip)} style={[styles.categoryChip, filter === chip && styles.categoryChipActive]}><Text style={[styles.categoryText, filter === chip && styles.categoryTextActive]}>{chip}</Text></Pressable>)}</View>
      {notice ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}><IconSymbol name="checkmark.circle.fill" size={17} color="#287A4B" /><Text style={styles.noticeText}>{notice}</Text></View> : null}

      <View style={styles.listHeader}><Text style={styles.sectionTitle}>{filter === 'All' ? 'Recent items' : filter}</Text><View style={styles.listHeaderRight}><Text style={styles.countText}>{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}</Text>{items.length > 0 ? <Pressable onPress={clearAll}><Text style={styles.clearText}>Clear all</Text></Pressable> : null}</View></View>
      <FlatList data={visibleItems} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E76F51" />} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><IconSymbol name={query.trim() || filter !== 'All' ? 'magnifyingglass' : 'doc.on.clipboard'} size={30} color="#E76F51" /></View><Text style={styles.emptyTitle}>{query.trim() || filter !== 'All' ? 'No matching items' : 'Nothing here yet'}</Text><Text style={styles.emptyCopy}>{query.trim() || filter !== 'All' ? 'Try a different search or filter to find another saved item.' : 'Paste something from your clipboard and it will appear in your history.'}</Text>{query.trim() || filter !== 'All' ? <Pressable style={styles.resetButton} onPress={() => { setQuery(''); setFilter('All'); }}><Text style={styles.resetText}>Reset search</Text></Pressable> : null}</View>} renderItem={({ item }) =>         <Pressable accessibilityRole="button" accessibilityHint={item.type === 'image' ? 'Opens a full-screen image preview' : 'Opens item details'} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => item.type === 'image' && item.imageData ? setLightboxItem(item) : setSelectedItem(item)}>
        <View style={[styles.typeIcon, item.type === 'image' && styles.imageIcon]}><IconSymbol name={item.type === 'image' ? 'photo' : 'doc.text'} size={20} color={item.type === 'image' ? '#8063A6' : '#E76F51'} /></View>
        <View style={styles.cardBody}><View style={styles.metaRow}><View style={styles.metaContent}><Text style={styles.meta}>{item.source || 'Clipboard'} · {formatTime(item.timestamp)}</Text>{item.category ? <View style={[styles.categoryBadge, item.category === 'Work' ? styles.workBadge : styles.personalBadge]}><Text style={[styles.categoryBadgeText, item.category === 'Work' ? styles.workText : styles.personalText]}>{item.category}</Text></View> : null}</View><Pressable accessibilityRole="button" accessibilityLabel={item.favorite ? 'Remove from favorites' : 'Add to favorites'} accessibilityState={{ selected: item.favorite }} onPress={() => toggleFavorite(item.id)} hitSlop={8}><IconSymbol name={item.favorite ? 'star.fill' : 'star'} size={19} color={item.favorite ? '#E9A23B' : '#AEB5B9'} /></Pressable></View><Text numberOfLines={3} style={styles.content}>{item.type === 'image' && item.ocrText ? item.ocrText : item.content}</Text>{item.type === 'image' ? <Text style={styles.imageHint}>{item.ocrText ? 'Extracted text · tap to preview' : 'Tap to preview image · text not extracted yet'}</Text> : null}<View style={styles.cardActions}><Pressable accessibilityRole="button" accessibilityLabel={item.type === 'image' ? 'Copy image to clipboard' : 'Copy text to clipboard'} style={({ pressed }) => [styles.copyAction, pressed && styles.actionPressed]} onPress={() => copyItem(item)}><IconSymbol name="doc.on.doc" size={15} color="#E76F51" /><Text style={styles.copyText}>Copy</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete clipboard item" onPress={() => Alert.alert('Delete item?', 'This will remove it from your history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) }])}><Text style={styles.deleteText}>Delete</Text></Pressable></View></View>
      </Pressable>} />
      <Modal visible={selectedItem !== null} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Clipboard item</Text><Pressable onPress={() => setSelectedItem(null)}><IconSymbol name="xmark.circle.fill" size={24} color="#9AA3AA" /></Pressable></View>
          {selectedItem ? <><Text style={styles.modalMeta}>{selectedItem.source || 'Clipboard'} · {formatTime(selectedItem.timestamp)}</Text><Text style={styles.modalContent}>{selectedItem.content}</Text>{selectedItem.ocrText ? <><Text style={styles.categoryLabel}>EXTRACTED TEXT</Text><Text style={styles.ocrText}>{selectedItem.ocrText}</Text></> : null}<Text style={styles.categoryLabel}>CATEGORY</Text><View style={styles.modalCategoryRow}>{(['Work', 'Personal'] as Category[]).map((category) => <Pressable key={category} onPress={() => { setCategory(selectedItem.id, category); setSelectedItem({ ...selectedItem, category }); showNotice(`${category} category saved`); }} style={[styles.modalCategory, selectedItem.category === category && styles.modalCategoryActive]}><Text style={[styles.modalCategoryText, selectedItem.category === category && styles.modalCategoryTextActive]}>{category}</Text></Pressable>)}</View><View style={styles.modalActions}><Pressable style={styles.modalPrimary} onPress={() => { copyItem(selectedItem); setSelectedItem(null); }}><IconSymbol name="doc.on.doc" size={17} color="#FFFFFF" /><Text style={styles.modalPrimaryText}>Copy to clipboard</Text></Pressable><Pressable style={styles.modalSecondary} onPress={() => { toggleFavorite(selectedItem.id); setSelectedItem({ ...selectedItem, favorite: !selectedItem.favorite }); showNotice(selectedItem.favorite ? 'Removed from favorites' : 'Added to favorites'); }}><IconSymbol name={selectedItem.favorite ? 'star.fill' : 'star'} size={17} color="#E76F51" /><Text style={styles.modalSecondaryText}>{selectedItem.favorite ? 'Unfavorite' : 'Favorite'}</Text></Pressable><Pressable style={styles.modalDanger} onPress={deleteSelected}><IconSymbol name="xmark" size={17} color="#C9553B" /><Text style={styles.modalDangerText}>Delete item</Text></Pressable></View></> : null}
        </View></View>
      </Modal>
      <Modal visible={lightboxItem !== null} animationType="fade" transparent onRequestClose={() => setLightboxItem(null)}>
        <View style={styles.lightboxBackdrop}><Pressable accessibilityRole="button" accessibilityLabel="Close image preview" style={[styles.lightboxClose, { top: insets.top + 12 }]} onPress={() => setLightboxItem(null)}><Text style={styles.lightboxCloseText}>Close</Text></Pressable>{lightboxItem?.imageData ? <Image resizeMode="contain" style={styles.lightboxImage} source={{ uri: `data:image/png;base64,${lightboxItem.imageData}` }} /> : <ActivityIndicator color="#FFFFFF" />}{lightboxItem ? <View style={styles.lightboxInfo}><Text style={styles.lightboxInfoTitle}>{lightboxItem.ocrText ? 'Extracted text' : 'No extracted text yet'}</Text>{lightboxItem.ocrText ? <Text style={styles.lightboxInfoText}>{lightboxItem.ocrText}</Text> : null}{lightboxItem.imageSize ? <Text style={styles.lightboxInfoMeta}>{lightboxItem.imageSize.width} × {lightboxItem.imageSize.height}px</Text> : null}</View> : null}{lightboxItem && !lightboxItem.ocrText ? <Pressable accessibilityRole="button" accessibilityLabel="Extract text from image" accessibilityState={{ busy: ocrMutation.isPending, disabled: ocrMutation.isPending }} disabled={ocrMutation.isPending} style={({ pressed }) => [styles.ocrRetryButton, { bottom: insets.bottom + 18 }, pressed && styles.primaryPressed]} onPress={() => void retryOcr(lightboxItem)}><Text style={styles.ocrRetryText}>{ocrMutation.isPending ? 'Extracting text…' : 'Extract text'}</Text></Pressable> : null}</View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  eyebrow: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: '#1F2933', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  settingsButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E4DF' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  summaryNumber: { color: '#1F2933', fontSize: 20, fontWeight: '800' }, summaryLabel: { color: '#8A949D', fontSize: 12, marginTop: 2 }, summaryDivider: { height: 28, width: 1, backgroundColor: '#DDD8D2', marginHorizontal: 18 }, summarySpacer: { flex: 1 },
  pasteButton: { backgroundColor: '#E76F51', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 6 }, pasteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  searchWrap: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DF', height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 }, searchInput: { flex: 1, color: '#1F2933', fontSize: 15 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 8 }, categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 13 }, categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 11, backgroundColor: '#EDEAE6' }, categoryChipActive: { backgroundColor: '#E7DDF5' }, categoryText: { color: '#8A949D', fontSize: 12, fontWeight: '700' }, categoryTextActive: { color: '#8063A6' }, chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 13, backgroundColor: '#ECE9E5' }, chipActive: { backgroundColor: '#FCE5DE' }, chipText: { color: '#7B8794', fontSize: 13, fontWeight: '700' }, chipTextActive: { color: '#C9553B' },
  notice: { backgroundColor: '#DDF3E4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 }, noticeText: { color: '#287A4B', fontSize: 13, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }, listHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 }, clearText: { color: '#C9553B', fontSize: 12, fontWeight: '800' }, sectionTitle: { color: '#1F2933', fontSize: 18, fontWeight: '800' }, countText: { color: '#98A1A7', fontSize: 12, fontWeight: '600' }, listContent: { paddingBottom: 32, gap: 10 },
  cardPressed: { opacity: 0.72, transform: [{ scale: 0.995 }] }, iconPressed: { opacity: 0.68 }, primaryPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, pasteDisabled: { opacity: 0.58 }, chipPressed: { opacity: 0.72 }, actionPressed: { opacity: 0.62 }, card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 15, flexDirection: 'row', borderWidth: 1, borderColor: '#E8E4DF' }, typeIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FCE5DE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, imageIcon: { backgroundColor: '#E8DFF5' }, cardBody: { flex: 1 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, metaContent: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }, categoryBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }, workBadge: { backgroundColor: '#E7DDF5' }, personalBadge: { backgroundColor: '#FFF3D9' }, categoryBadgeText: { fontSize: 9, fontWeight: '800' }, workText: { color: '#8063A6' }, personalText: { color: '#B4771F' }, meta: { color: '#9AA3AA', fontSize: 11, fontWeight: '600' }, content: { color: '#29343D', fontSize: 15, lineHeight: 21, fontWeight: '500' }, imageHint: { color: '#9AA3AA', fontSize: 11, marginTop: 5, fontWeight: '600' }, cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 15 }, copyAction: { flexDirection: 'row', alignItems: 'center', gap: 5 }, copyText: { color: '#E76F51', fontSize: 13, fontWeight: '800' }, deleteText: { color: '#A7AFB4', fontSize: 13, fontWeight: '700' },
  lightboxBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,28,0.96)', alignItems: 'center', justifyContent: 'center', padding: 20 }, lightboxInfo: { position: 'absolute', left: 20, right: 20, bottom: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 12 }, lightboxInfoTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, lightboxInfoText: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, marginTop: 5 }, lightboxInfoMeta: { color: '#B9C0C4', fontSize: 11, marginTop: 6 }, lightboxImage: { width: '100%', height: '80%' }, lightboxClose: { position: 'absolute', top: 58, right: 20, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }, lightboxCloseText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, ocrRetryButton: { position: 'absolute', backgroundColor: '#E76F51', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11 }, ocrRetryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }, ocrText: { color: '#29343D', backgroundColor: '#F6F4F1', borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31,41,51,0.28)' }, modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 34 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, modalTitle: { color: '#1F2933', fontSize: 20, fontWeight: '800' }, modalMeta: { color: '#9AA3AA', fontSize: 12, fontWeight: '700', marginTop: 16 }, categoryLabel: { color: '#9AA3AA', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 20, marginBottom: 8 }, modalCategoryRow: { flexDirection: 'row', gap: 8 }, modalCategory: { borderWidth: 1, borderColor: '#E8E4DF', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 8 }, modalCategoryActive: { backgroundColor: '#E7DDF5', borderColor: '#C8B5E0' }, modalCategoryText: { color: '#7B8794', fontSize: 12, fontWeight: '700' }, modalCategoryTextActive: { color: '#8063A6' }, modalContent: { color: '#29343D', fontSize: 17, lineHeight: 25, marginTop: 10, minHeight: 90 }, modalActions: { gap: 10, marginTop: 20 }, modalPrimary: { backgroundColor: '#E76F51', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalPrimaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }, modalSecondary: { borderWidth: 1, borderColor: '#F1C3B7', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalSecondaryText: { color: '#C9553B', fontWeight: '800', fontSize: 14 }, modalDanger: { height: 46, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modalDangerText: { color: '#C9553B', fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 55, paddingHorizontal: 36 }, resetButton: { backgroundColor: '#FCE5DE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 16 }, resetText: { color: '#C9553B', fontSize: 13, fontWeight: '800' }, emptyIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#FCE5DE', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, emptyTitle: { color: '#29343D', fontSize: 18, fontWeight: '800', marginBottom: 7 }, emptyCopy: { color: '#8A949D', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
