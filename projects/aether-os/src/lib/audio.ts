let context: AudioContext | null = null;
export function tone(freq: number, duration = 0.06, volume = 0.03, type: OscillatorType = 'sine') {
 if (typeof window === 'undefined') return;
 context ??= new AudioContext();
 if (context.state === 'suspended') void context.resume();
 const osc = context.createOscillator(); const gain = context.createGain();
 osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(volume, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
 osc.connect(gain).connect(context.destination); osc.start(); osc.stop(context.currentTime + duration);
}
