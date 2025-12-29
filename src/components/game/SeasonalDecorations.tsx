import { useEffect, useState, useMemo } from 'react';
import { useSeasonalTheme, SeasonalTheme } from '@/contexts/SeasonalThemeContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  delay: number;
}

const PARTICLE_CONFIGS: Record<Exclude<SeasonalTheme, 'default'>, {
  emoji: string;
  count: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
}> = {
  christmas: {
    emoji: '❄️',
    count: 25,
    minSize: 12,
    maxSize: 24,
    minSpeed: 1,
    maxSpeed: 3
  },
  halloween: {
    emoji: '🎃',
    count: 12,
    minSize: 20,
    maxSize: 32,
    minSpeed: 0.5,
    maxSpeed: 1.5
  },
  easter: {
    emoji: '🥚',
    count: 15,
    minSize: 16,
    maxSize: 26,
    minSpeed: 0.8,
    maxSpeed: 2
  },
  carnival: {
    emoji: '🎊',
    count: 20,
    minSize: 14,
    maxSize: 24,
    minSpeed: 1.2,
    maxSpeed: 2.5
  }
};

// Secondary particles for variety
const SECONDARY_EMOJIS: Record<Exclude<SeasonalTheme, 'default'>, string> = {
  christmas: '⭐',
  halloween: '👻',
  easter: '🐰',
  carnival: '🎭'
};

export const SeasonalDecorations = () => {
  const { activeTheme } = useSeasonalTheme();
  const [particles, setParticles] = useState<Particle[]>([]);

  const config = activeTheme !== 'default' ? PARTICLE_CONFIGS[activeTheme] : null;

  // Generate particles when theme changes
  useEffect(() => {
    if (!config) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = [];
    const { count, minSize, maxSize, minSpeed, maxSpeed } = config;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 100, // Start above viewport
        size: minSize + Math.random() * (maxSize - minSize),
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.4 + Math.random() * 0.4,
        delay: Math.random() * 10
      });
    }

    setParticles(newParticles);
  }, [activeTheme, config]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        let newY = p.y + p.speed * 0.3;
        let newX = p.x + Math.sin((p.y + Date.now() * 0.001) * 0.1) * 0.1;
        
        // Reset particle when it goes below viewport
        if (newY > 110) {
          newY = -20;
          newX = Math.random() * 100;
        }

        return {
          ...p,
          y: newY,
          x: newX,
          rotation: p.rotation + p.rotationSpeed
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (activeTheme === 'default' || !config) {
    return null;
  }

  const emoji = config.emoji;
  const secondaryEmoji = SECONDARY_EMOJIS[activeTheme];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle, index) => (
        <div
          key={particle.id}
          className="absolute transition-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}px`,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${particle.delay}s`
          }}
        >
          {index % 4 === 0 ? secondaryEmoji : emoji}
        </div>
      ))}
    </div>
  );
};
