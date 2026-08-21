import React, { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container} accessibilityRole="alert">
        <Text style={styles.eyebrow}>CLIPBOARD MANAGER</Text>
        <Text style={styles.title}>Something needs a reset</Text>
        <Text style={styles.message}>The current screen could not be rendered safely. Your local clipboard data was not changed.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry rendering Clipboard Manager" onPress={this.handleRetry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#F6F4F1' },
  eyebrow: { color: '#E76F51', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#29343D', fontSize: 25, fontWeight: '800', marginTop: 9, textAlign: 'center' },
  message: { color: '#7B8794', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 360, textAlign: 'center' },
  button: { backgroundColor: '#E76F51', borderRadius: 14, minWidth: 140, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 22, paddingHorizontal: 22 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
