import { useSound } from '@/contexts/SoundContext';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const SoundToggle = () => {
  const { isMuted, toggleMute, playSound } = useSound();

  const handleClick = () => {
    toggleMute();
    if (isMuted) {
      // Play click sound when unmuting to confirm sound is working
      setTimeout(() => playSound('click'), 50);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClick}
            className="relative"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isMuted ? 'Unmute sounds' : 'Mute sounds'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
