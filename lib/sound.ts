// Sound effects using Web Audio API for cross-browser compatibility
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  // Sound effects
  playClick() {
    this.playTone(800, 0.1, 'square');
  }

  playSuccess() {
    // Success chime: ascending notes
    setTimeout(() => this.playTone(523, 0.15), 0);   // C5
    setTimeout(() => this.playTone(659, 0.15), 100); // E5
    setTimeout(() => this.playTone(784, 0.3), 200);  // G5
  }

  playError() {
    this.playTone(200, 0.3, 'sawtooth');
  }

  playPuzzleComplete() {
    // Celebration sound
    setTimeout(() => this.playTone(523, 0.2), 0);   // C5
    setTimeout(() => this.playTone(659, 0.2), 150); // E5
    setTimeout(() => this.playTone(784, 0.2), 300); // G5
    setTimeout(() => this.playTone(1047, 0.4), 450); // C6
  }
}

export const soundManager = new SoundManager();