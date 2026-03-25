// Haptic feedback for mobile devices
class HapticManager {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  private isSupported(): boolean {
    return 'vibrate' in navigator || 'haptics' in navigator;
  }

  // Basic vibration
  vibrate(pattern: number | number[] = 50) {
    if (!this.enabled || !this.isSupported()) return;

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
    }
  }

  // Predefined feedback types
  light() {
    this.vibrate(20);
  }

  medium() {
    this.vibrate(50);
  }

  heavy() {
    this.vibrate([50, 50, 50]);
  }

  success() {
    this.vibrate([50, 50, 100]);
  }

  error() {
    this.vibrate([100, 50, 100, 50, 100]);
  }

  click() {
    this.vibrate(10);
  }
}

export const hapticManager = new HapticManager();