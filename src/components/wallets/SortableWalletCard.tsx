import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { WalletCard } from './WalletCard';
import { Wallet } from '@/types/wallet';

interface SortableWalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onToggleActive: (wallet: Wallet) => void;
  onTransfer?: (wallet: Wallet) => void;
  isDragging?: boolean;
}

export const SortableWalletCard = ({ 
  wallet, 
  onEdit, 
  onToggleActive, 
  onTransfer,
}: SortableWalletCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 cursor-grab active:cursor-grabbing touch-none z-10"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div className="pl-6">
        <WalletCard
          wallet={wallet}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onTransfer={onTransfer}
        />
      </div>
    </div>
  );
};
