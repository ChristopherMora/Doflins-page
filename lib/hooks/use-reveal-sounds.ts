"use client";

import { useCallback, useRef, useEffect } from "react";

// Web Audio API based sound effects - no external files needed
type SoundType = "flip" | "reveal" | "epic" | "legendary" | "mythic" | "confetti" | "whoosh";

interface OscillatorConfig {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
  attack?: number;
  decay?: number;
}

const SOUND_CONFIGS: Record<SoundType, OscillatorConfig[]> = {
  flip: [
    { type: "sine", frequency: 800, duration: 0.08, gain: 0.15, attack: 0.01, decay: 0.07 },
    { type: "sine", frequency: 1200, duration: 0.06, gain: 0.1, attack: 0.01, decay: 0.05 },
  ],
  reveal: [
    { type: "sine", frequency: 523, duration: 0.1, gain: 0.2, attack: 0.01, decay: 0.09 },
    { type: "sine", frequency: 659, duration: 0.1, gain: 0.15, attack: 0.02, decay: 0.08 },
    { type: "sine", frequency: 784, duration: 0.15, gain: 0.2, attack: 0.03, decay: 0.12 },
  ],
  epic: [
    { type: "sine", frequency: 440, duration: 0.15, gain: 0.25, attack: 0.02, decay: 0.13 },
    { type: "sine", frequency: 554, duration: 0.15, gain: 0.2, attack: 0.04, decay: 0.11 },
    { type: "sine", frequency: 659, duration: 0.2, gain: 0.25, attack: 0.06, decay: 0.14 },
    { type: "sine", frequency: 880, duration: 0.3, gain: 0.3, attack: 0.08, decay: 0.22 },
  ],
  legendary: [
    { type: "sine", frequency: 392, duration: 0.2, gain: 0.3, attack: 0.02, decay: 0.18 },
    { type: "sine", frequency: 494, duration: 0.2, gain: 0.25, attack: 0.05, decay: 0.15 },
    { type: "sine", frequency: 587, duration: 0.25, gain: 0.3, attack: 0.08, decay: 0.17 },
    { type: "sine", frequency: 784, duration: 0.35, gain: 0.35, attack: 0.1, decay: 0.25 },
    { type: "triangle", frequency: 1568, duration: 0.5, gain: 0.15, attack: 0.15, decay: 0.35 },
  ],
  mythic: [
    { type: "sine", frequency: 330, duration: 0.25, gain: 0.3, attack: 0.02, decay: 0.23 },
    { type: "sine", frequency: 415, duration: 0.25, gain: 0.25, attack: 0.06, decay: 0.19 },
    { type: "sine", frequency: 523, duration: 0.3, gain: 0.3, attack: 0.1, decay: 0.2 },
    { type: "sine", frequency: 659, duration: 0.35, gain: 0.35, attack: 0.15, decay: 0.2 },
    { type: "sine", frequency: 880, duration: 0.5, gain: 0.4, attack: 0.2, decay: 0.3 },
    { type: "triangle", frequency: 1760, duration: 0.6, gain: 0.2, attack: 0.25, decay: 0.35 },
  ],
  confetti: [
    { type: "sine", frequency: 1047, duration: 0.08, gain: 0.15, attack: 0.01, decay: 0.07 },
    { type: "sine", frequency: 1319, duration: 0.08, gain: 0.12, attack: 0.02, decay: 0.06 },
    { type: "sine", frequency: 1568, duration: 0.1, gain: 0.15, attack: 0.03, decay: 0.07 },
    { type: "sine", frequency: 2093, duration: 0.15, gain: 0.1, attack: 0.05, decay: 0.1 },
  ],
  whoosh: [
    { type: "sawtooth", frequency: 200, duration: 0.15, gain: 0.08, attack: 0.01, decay: 0.14 },
  ],
};

const RARITY_SOUNDS: Record<string, SoundType> = {
  COMMON: "reveal",
  RARE: "reveal",
  EPIC: "epic",
  LEGENDARY: "legendary",
  ULTRA: "legendary",
  MYTHIC: "mythic",
};

export function useRevealSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current && typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;
    
    const ctx = initAudio();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const configs = SOUND_CONFIGS[type];
    if (!configs) return;

    const now = ctx.currentTime;

    configs.forEach((config, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.value = config.frequency;

      // Envelope
      const attack = config.attack ?? 0.01;
      const decay = config.decay ?? config.duration - attack;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(config.gain, now + attack);
      gain.gain.linearRampToValueAtTime(0, now + attack + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + (index * 0.05);
      osc.start(startTime);
      osc.stop(startTime + config.duration);
    });
  }, [initAudio]);

  const playFlip = useCallback(() => playSound("flip"), [playSound]);
  
  const playReveal = useCallback((rarity: string) => {
    const soundType = RARITY_SOUNDS[rarity] ?? "reveal";
    playSound(soundType);
  }, [playSound]);

  const playCelebration = useCallback((rarity: string) => {
    const soundType = RARITY_SOUNDS[rarity] ?? "epic";
    playSound(soundType);
    // Add confetti sound after main fanfare
    setTimeout(() => playSound("confetti"), 300);
  }, [playSound]);

  const playWhoosh = useCallback(() => playSound("whoosh"), [playSound]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  // Pre-warm audio context on first touch/click
  const warmUp = useCallback(() => {
    initAudio();
  }, [initAudio]);

  return {
    playFlip,
    playReveal,
    playCelebration,
    playWhoosh,
    setEnabled,
    warmUp,
  };
}
