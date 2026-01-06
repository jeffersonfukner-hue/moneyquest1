import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Plus, Check, Trash2, Trophy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePersonalRewards, PersonalReward } from '@/hooks/usePersonalRewards';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const REWARD_ICONS = ['🎁', '☕', '📚', '🍽️', '🏖️', '🎮', '🎬', '👕', '💅', '🎵', '🌟', '🏆'];

export const PersonalRewardsCard = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { rewards, loading, addReward, claimReward, deleteReward, suggestions, getClaimableRewards } = usePersonalRewards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReward, setNewReward] = useState({ name: '', description: '', xp_threshold: 500, icon: '🎁' });

  const currentXP = profile?.xp || 0;
  const claimableRewards = getClaimableRewards(currentXP);

  const handleAddReward = async () => {
    if (!newReward.name.trim()) {
      toast.error('Digite um nome para a recompensa');
      return;
    }

    const { error } = await addReward(newReward);
    if (error) {
      toast.error('Erro ao adicionar recompensa');
    } else {
      toast.success('Recompensa adicionada!');
      setNewReward({ name: '', description: '', xp_threshold: 500, icon: '🎁' });
      setIsDialogOpen(false);
    }
  };

  const handleClaim = async (reward: PersonalReward) => {
    const { error } = await claimReward(reward.id);
    if (error) {
      toast.error('Erro ao resgatar recompensa');
    } else {
      toast.success(`🎉 Recompensa resgatada: ${reward.name}!`);
    }
  };

  const handleDelete = async (rewardId: string) => {
    const { error } = await deleteReward(rewardId);
    if (error) {
      toast.error('Erro ao remover recompensa');
    } else {
      toast.success('Recompensa removida');
    }
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setNewReward({
      name: suggestion.name,
      description: suggestion.description,
      xp_threshold: suggestion.xp,
      icon: suggestion.icon,
    });
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-lg">Minhas Recompensas</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Criar Recompensa
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Suggestions */}
                <div>
                  <Label className="text-xs text-muted-foreground">Sugestões rápidas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map((s, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        {s.icon} {s.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Nome da recompensa</Label>
                    <Input
                      value={newReward.name}
                      onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                      placeholder="Ex: Café especial"
                    />
                  </div>

                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Input
                      value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                      placeholder="Ex: Na minha cafeteria favorita"
                    />
                  </div>

                  <div>
                    <Label>Meta de XP</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={newReward.xp_threshold}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewReward({ ...newReward, xp_threshold: parseInt(val) || 100 });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Você tem {currentXP.toLocaleString()} XP atualmente
                    </p>
                  </div>

                  <div>
                    <Label>Ícone</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {REWARD_ICONS.map((icon) => (
                        <Button
                          key={icon}
                          variant={newReward.icon === icon ? 'default' : 'outline'}
                          size="sm"
                          className="w-10 h-10 text-lg"
                          onClick={() => setNewReward({ ...newReward, icon })}
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Dica: Escolha recompensas que não sabotem sua economia! 
                    O objetivo é celebrar conquistas, não gastar desnecessariamente.
                  </p>
                </div>

                <Button onClick={handleAddReward} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Recompensa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Claimable rewards alert */}
        {claimableRewards.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {claimableRewards.length} recompensa(s) disponível(is) para resgatar!
              </span>
            </div>
          </div>
        )}

        {rewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma recompensa configurada</p>
            <p className="text-xs mt-1">Crie metas pessoais para seus marcos de XP!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map((reward) => {
              const progress = Math.min((currentXP / reward.xp_threshold) * 100, 100);
              const canClaim = currentXP >= reward.xp_threshold && !reward.is_claimed;

              return (
                <div
                  key={reward.id}
                  className={cn(
                    'relative p-3 rounded-lg border transition-all',
                    reward.is_claimed
                      ? 'bg-success/10 border-success/30'
                      : canClaim
                      ? 'bg-amber-500/10 border-amber-500/30 animate-pulse'
                      : 'bg-muted/30 border-border'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                        reward.is_claimed
                          ? 'bg-success/20'
                          : canClaim
                          ? 'bg-amber-500/20'
                          : 'bg-muted'
                      )}
                    >
                      {reward.is_claimed ? <Check className="w-5 h-5 text-success" /> : reward.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            'font-medium text-sm truncate',
                            reward.is_claimed && 'line-through text-muted-foreground'
                          )}
                        >
                          {reward.name}
                        </h4>
                        {reward.is_claimed && (
                          <span className="text-xs text-success font-medium">Resgatada!</span>
                        )}
                      </div>

                      {reward.description && (
                        <p className="text-xs text-muted-foreground truncate">{reward.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {currentXP.toLocaleString()}/{reward.xp_threshold.toLocaleString()} XP
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {canClaim && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                          onClick={() => handleClaim(reward)}
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          Resgatar
                        </Button>
                      )}
                      {!reward.is_claimed && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(reward.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
