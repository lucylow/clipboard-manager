import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { diagnosticsEqual } from "@/lib/lightbox-diagnostics";
import {
  LIGHTBOX_ACTION_CONTROLS,
  resetLightboxAdapter,
  runLightboxAction,
  type LightboxAction,
} from "@/lib/lightbox-diagnostics-panel";
import {
  createLightboxInteractionAdapter,
  type LightboxInteractionAdapter,
  type LightboxInteractionDiagnostics,
} from "@/lib/lightbox-interaction-adapter";

type PaletteName = keyof typeof SchemeColors.light;

const paletteNames: PaletteName[] = Object.keys(SchemeColors.light) as PaletteName[];

function ColorSwatch({ name, value }: { name: PaletteName; value: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-border px-3 py-2">
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: value }} />
        <Text className="text-sm font-semibold text-foreground">{name}</Text>
      </View>
      <Text className="text-xs font-mono text-muted">{value}</Text>
    </View>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}

function diagnosticsLabel(diagnostics: LightboxInteractionDiagnostics) {
  return diagnostics.released ? "Released" : diagnostics.notifying ? "Draining" : "Idle";
}

export default function ThemeLabScreen() {
  const [pressCount, setPressCount] = useState(0);
  const [lastAction, setLastAction] = useState<string>("None yet");
  const { colorScheme, setColorScheme } = useThemeContext();
  const colors = useColors();
  const [lightboxAdapter, setLightboxAdapter] = useState<LightboxInteractionAdapter>(() =>
    createLightboxInteractionAdapter(),
  );
  const [lightboxDiagnostics, setLightboxDiagnostics] = useState<LightboxInteractionDiagnostics>(() =>
    lightboxAdapter.getDiagnostics(),
  );

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      const nextDiagnostics = lightboxAdapter.getDiagnostics();
      setLightboxDiagnostics((previous) =>
        diagnosticsEqual(previous, nextDiagnostics) ? previous : nextDiagnostics,
      );
    };
    const unsubscribe = lightboxAdapter.subscribe(sync);
    sync();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [lightboxAdapter]);

  const handleLightboxAction = useCallback((action: LightboxAction) => {
    runLightboxAction(lightboxAdapter, action);
  }, [lightboxAdapter]);

  const handleResetLightboxAdapter = useCallback(() => {
    const nextAdapter = resetLightboxAdapter(lightboxAdapter, createLightboxInteractionAdapter);
    setLightboxAdapter(nextAdapter);
    const nextDiagnostics = nextAdapter.getDiagnostics();
    setLightboxDiagnostics((previous) =>
      diagnosticsEqual(previous, nextDiagnostics) ? previous : nextDiagnostics,
    );
  }, [lightboxAdapter]);

  const swatches = useMemo(
    () =>
      paletteNames.map((name) => ({
        name,
        value: SchemeColors[colorScheme][name],
      })),
    [colorScheme],
  );

  const tileStyles = useMemo(() => {
    const build = (scheme: ColorScheme) => ({
      background: SchemeColors[scheme].background,
      border: SchemeColors[scheme].border,
      text: SchemeColors[scheme].foreground,
      subText: SchemeColors[scheme].muted,
      activeBackground: SchemeColors[scheme].primary,
      activeText: SchemeColors[scheme].background,
    });
    return {
      light: build("light"),
      dark: build("dark"),
    };
  }, []);

  return (
    <ScreenContainer className="p-5">
      <ScrollView className="flex-1">
        <View className="gap-4 pb-8">
          <View className="flex-row gap-2">
            {(["light", "dark"] as ColorScheme[]).map((scheme) => (
              <Pressable
                key={scheme}
                style={[
                  styles.schemeToggle,
                  {
                    backgroundColor:
                      colorScheme === scheme
                        ? tileStyles[scheme].activeBackground
                        : tileStyles[scheme].background,
                    borderColor:
                      colorScheme === scheme
                        ? tileStyles[scheme].activeBackground
                        : tileStyles[scheme].border,
                  },
                ]}
                onPress={() => {
                  setColorScheme(scheme);
                  setLastAction(`Applied ${scheme} globally`);
                }}
              >
                <Text
                  style={[
                    styles.schemeToggleTitle,
                    {
                      color:
                        colorScheme === scheme
                          ? tileStyles[scheme].activeText
                          : tileStyles[scheme].text,
                    },
                  ]}
                >
                  {scheme === "light" ? "Light preview" : "Dark preview"}
                </Text>
                <Text
                  style={[
                    styles.schemeToggleSubtitle,
                    {
                      color:
                        colorScheme === scheme
                          ? tileStyles[scheme].activeText
                          : tileStyles[scheme].subText,
                    },
                  ]}
                >
                  Global theme (NativeWind + useColors)
                </Text>
              </Pressable>
            ))}
          </View>

          <ThemedView className="rounded-2xl border border-border p-4">
            <Text className="text-lg font-bold text-foreground">
              Tailwind tokens
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Buttons and badges driven by global {colorScheme} palette
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: SchemeColors[colorScheme].primary }}
                onPress={() => {
                  setPressCount((count) => count + 1);
                  setLastAction("Pressed Primary token");
                }}
              >
                <Text className="text-sm font-semibold text-background">Primary</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full px-4 py-2 border border-border"
                style={{ backgroundColor: SchemeColors[colorScheme].surface }}
                onPress={() => {
                  setPressCount((count) => count + 1);
                  setLastAction("Pressed Surface token");
                }}
              >
                <Text className="text-sm font-semibold text-foreground">
                  Surface
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: SchemeColors[colorScheme].success }}
                onPress={() => {
                  setPressCount((count) => count + 1);
                  setLastAction("Pressed Success token");
                }}
              >
                <Text className="text-sm font-semibold text-background">
                  Success
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: SchemeColors[colorScheme].warning }}
                onPress={() => {
                  setPressCount((count) => count + 1);
                  setLastAction("Pressed Warning token");
                }}
              >
                <Text className="text-sm font-semibold text-background">
                  Warning
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: SchemeColors[colorScheme].error }}
                onPress={() => {
                  setPressCount((count) => count + 1);
                  setLastAction("Pressed Error token");
                }}
              >
                <Text className="text-sm font-semibold text-background">
                  Error
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4 rounded-xl bg-background p-4 border border-border">
              <Text className="text-base font-semibold text-foreground">
                useColors()
              </Text>
              <Text className="mt-1 text-sm text-muted">
                Background: {colors.background} • Text: {colors.text} • Tint: {colors.tint}
              </Text>
              <Text className="text-xs text-muted">
                (Pressable uses style; Tailwind on Pressable is disabled via remap)
              </Text>
              <View className="mt-3 gap-2">
                <View className="flex-row items-center gap-2">
                  <IconSymbol name="house.fill" color={colors.tint} size={20} />
                  <Text className="text-sm text-foreground">
                    Press count: {pressCount}
                  </Text>
                </View>
                <Text className="text-sm text-muted">
                  Last action: {lastAction}
                </Text>
              </View>
            </View>
          </ThemedView>

          <ThemedView className="rounded-2xl border border-border p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-foreground">Lightbox diagnostics</Text>
                <Text className="mt-1 text-sm text-muted">
                  Development-only adapter probe. Changes here do not affect saved clipboard data.
                </Text>
              </View>
              <View className="rounded-full bg-warning px-2 py-1">
                <Text className="text-xs font-bold text-background">DEV</Text>
              </View>
            </View>

            <View className="mt-4 rounded-xl bg-background p-3 border border-border">
              <DiagnosticRow label="Lifecycle" value={diagnosticsLabel(lightboxDiagnostics)} />
              <DiagnosticRow label="Visible" value={lightboxDiagnostics.state.visible ? "Yes" : "No"} />
              <DiagnosticRow label="Action busy" value={lightboxDiagnostics.state.actionBusy ? "Yes" : "No"} />
              <DiagnosticRow label="Retry available" value={lightboxDiagnostics.state.retryAvailable ? "Yes" : "No"} />
              <DiagnosticRow label="Pending events" value={String(lightboxDiagnostics.pendingEventCount)} />
              <DiagnosticRow label="Listeners" value={String(lightboxDiagnostics.listenerCount)} />
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {LIGHTBOX_ACTION_CONTROLS.map(({ action, label }) => (
                <Pressable
                  key={action}
                  accessibilityRole="button"
                  accessibilityLabel={`Run lightbox ${label.toLowerCase()} action`}
                  onPress={() => handleLightboxAction(action)}
                  style={({ pressed }) => [
                    styles.diagnosticButton,
                    { backgroundColor: colors.tint, opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <Text className="text-xs font-semibold text-background">{label}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset lightbox diagnostics adapter"
                onPress={handleResetLightboxAdapter}
                style={({ pressed }) => [
                  styles.diagnosticButton,
                  styles.diagnosticResetButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text className="text-xs font-semibold text-foreground">Reset</Text>
              </Pressable>
            </View>
          </ThemedView>

          <ThemedView className="rounded-2xl border border-border p-4">
            <Text className="text-lg font-bold text-foreground">
              Palette values
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Live values for the selected scheme
            </Text>
            <View className="mt-3 gap-2">
              {swatches.map((item) => (
                <ColorSwatch key={item.name} name={item.name} value={item.value} />
              ))}
            </View>
          </ThemedView>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  schemeToggle: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  schemeToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  schemeToggleSubtitle: {
    fontSize: 12,
  },
  diagnosticButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  diagnosticResetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
});
