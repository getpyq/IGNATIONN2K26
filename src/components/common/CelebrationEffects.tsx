import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const CELEBRATION_COLORS = ['#8e1b1b', '#c8221a', '#e0a526', '#3e9b47', '#fff4e2', '#1b1b1b'];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export function unlockCelebrationAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

export async function playCelebrationChime(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const base = ctx.currentTime + 0.02;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, base + idx * 0.11);
      gain.gain.setValueAtTime(0.001, base + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(
        0.14,
        base + idx * 0.11 + 0.04
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        base + idx * 0.11 + 0.55
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(base + idx * 0.11);
      osc.stop(base + idx * 0.11 + 0.6);
    });
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

export function CelebrationEffects({ active }: { active: boolean }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || firedRef.current) return;
    firedRef.current = true;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        void confetti({
          particleCount: 95,
          spread: 85,
          origin: { y: 0.55 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
      }, 300)
    );

    timers.push(
      window.setTimeout(() => {
        void confetti({
          particleCount: 55,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.68 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
        void confetti({
          particleCount: 55,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.68 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
      }, 950)
    );

    timers.push(
      window.setTimeout(() => {
        void confetti({
          particleCount: 45,
          spread: 360,
          startVelocity: 28,
          ticks: 75,
          origin: { x: 0.3, y: 0.3 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
        void confetti({
          particleCount: 45,
          spread: 360,
          startVelocity: 28,
          ticks: 75,
          origin: { x: 0.7, y: 0.28 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
      }, 1900)
    );

    timers.push(
      window.setTimeout(() => {
        void confetti({
          particleCount: 80,
          spread: 110,
          origin: { y: 0.5 },
          colors: CELEBRATION_COLORS,
          disableForReducedMotion: true,
        });
      }, 3200)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [active]);

  return null;
}
