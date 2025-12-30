import { cn } from '@/lib/utils';

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  avatarIcon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
  xl: 'w-24 h-24 text-5xl',
};

export const AvatarDisplay = ({
  avatarUrl,
  avatarIcon,
  size = 'md',
  className,
}: AvatarDisplayProps) => {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className={cn(
          sizeClass,
          'rounded-full object-cover border-2 border-primary/30',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        'rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/30',
        className
      )}
    >
      {avatarIcon || '🎮'}
    </div>
  );
};
