import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAICoach } from '@/hooks/useAICoach';
import { QuickActions } from './QuickActions';
import { Bot, Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

interface ProfileStats {
  level: number;
  level_title: string;
  xp: number;
  streak: number;
  total_income: number;
  total_expenses: number;
  financial_mood: string;
}

interface AICoachProps {
  transactions: Transaction[];
  profile: ProfileStats;
}

export const AICoach = ({ transactions, profile }: AICoachProps) => {
  const { t } = useTranslation();
  const { messages, isLoading, sendMessage, clearMessages } = useAICoach();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickAction = (type: 'spending_analysis' | 'savings_tip' | 'monthly_summary' | 'goal_coaching' | 'quick_insight') => {
    sendMessage({ transactions, profile, requestType: type });
  };

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ transactions, profile, requestType: 'chat', userMessage: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px] max-h-[80vh]">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          {t('aiCoach.title')}
        </CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{t('aiCoach.welcome.title')}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t('aiCoach.welcome.description')}
            </p>
            <QuickActions onAction={handleQuickAction} disabled={isLoading} />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-1 text-primary">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs font-medium">{t('aiCoach.coachName')}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t('aiCoach.thinking')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex-shrink-0">
              <QuickActions onAction={handleQuickAction} disabled={isLoading} />
            </div>
          </>
        )}
        
        <div className="flex-shrink-0 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('aiCoach.inputPlaceholder')}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
