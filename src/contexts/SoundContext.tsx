import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => void;
}

export type SoundType = 'questComplete' | 'badgeUnlock' | 'levelUp' | 'xpGain' | 'click';

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Create AudioContext lazily to avoid autoplay restrictions
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Sound synthesis functions using Web Audio API
const playSynthSound = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  envelope?: { attack: number; decay: number; sustain: number; release: number }
) => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  const env = envelope || { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 };
  const now = ctx.currentTime;
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + env.attack);
  gainNode.gain.linearRampToValueAtTime(env.sustain * 0.3, now + env.attack + env.decay);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
};

const playMelody = (notes: { freq: number; duration: number; delay: number }[], type: OscillatorType = 'sine') => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  notes.forEach(({ freq, duration, delay }) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, now + delay);
    
    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(0.25, now + delay + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + delay + duration);
    
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  });
};

// Sound definitions
const SOUNDS: Record<SoundType, () => void> = {
  questComplete: () => {
    // Triumphant ascending melody
    playMelody([
      { freq: 523.25, duration: 0.15, delay: 0 },    // C5
      { freq: 659.25, duration: 0.15, delay: 0.1 },  // E5
      { freq: 783.99, duration: 0.15, delay: 0.2 },  // G5
      { freq: 1046.50, duration: 0.4, delay: 0.3 },  // C6
    ], 'triangle');
  },
  
  badgeUnlock: () => {
    // Magical sparkle sound
    playMelody([
      { freq: 880, duration: 0.1, delay: 0 },
      { freq: 1108.73, duration: 0.1, delay: 0.05 },
      { freq: 1318.51, duration: 0.1, delay: 0.1 },
      { freq: 1760, duration: 0.3, delay: 0.15 },
      { freq: 2093, duration: 0.4, delay: 0.25 },
    ], 'sine');
  },
  
  levelUp: () => {
    // Epic fanfare
    playMelody([
      { freq: 392, duration: 0.2, delay: 0 },      // G4
      { freq: 392, duration: 0.1, delay: 0.15 },   // G4
      { freq: 392, duration: 0.1, delay: 0.25 },   // G4
      { freq: 523.25, duration: 0.5, delay: 0.35 },// C5
      { freq: 659.25, duration: 0.15, delay: 0.55 },// E5
      { freq: 783.99, duration: 0.5, delay: 0.7 }, // G5
    ], 'square');
  },
  
  xpGain: () => {
    // Quick coin-like sound
    playSynthSound(987.77, 0.15, 'sine', { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 });
  },
  
  click: () => {
    // Soft click
    playSynthSound(600, 0.05, 'sine', { attack: 0.001, decay: 0.02, sustain: 0.2, release: 0.02 });
  }
};

const STORAGE_KEY = 'moneyquest-sound-muted';

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    
    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext?.state === 'suspended') {
        audioContext.resume();
      }
      SOUNDS[type]();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [isMuted]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    return {
      isMuted: false,
      toggleMute: () => {},
      playSound: () => {}
    };
  }
  return context;
};
