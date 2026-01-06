import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type RequestType = 'spending_analysis' | 'savings_tip' | 'monthly_summary' | 'goal_coaching' | 'quick_insight' | 'chat';

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-coach`;

export const useAICoach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const { t } = useTranslation();

  const streamChat = useCallback(async ({
    transactions,
    profile,
    requestType,
    userMessage,
    onDelta,
    onDone,
  }: {
    transactions: Transaction[];
    profile: ProfileStats;
    requestType: RequestType;
    userMessage?: string;
    onDelta: (deltaText: string) => void;
    onDone: () => void;
  }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error('Invalid or expired token');
    }

    const resp = await fetch(COACH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transactions: transactions.slice(0, 100), // Limit to 100 most recent
        profile,
        requestType,
        userMessage,
        conversationHistory: messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
        language,
        currency,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: 'unknown' }));
      
      if (resp.status === 429) {
        toast({
          title: t('aiCoach.error.rateLimit'),
          description: t('aiCoach.error.rateLimitDesc'),
          variant: "destructive",
        });
        throw new Error('rate_limit');
      }
      
      if (resp.status === 402) {
        toast({
          title: t('aiCoach.error.credits'),
          description: t('aiCoach.error.creditsDesc'),
          variant: "destructive",
        });
        throw new Error('payment_required');
      }
      
      throw new Error(errorData.message || 'Failed to get AI response');
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  }, [messages, language, currency, toast, t]);

  const sendMessage = useCallback(async ({
    transactions,
    profile,
    requestType,
    userMessage,
  }: {
    transactions: Transaction[];
    profile: ProfileStats;
    requestType: RequestType;
    userMessage?: string;
  }) => {
    if (userMessage) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    }
    
    setIsLoading(true);
    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await streamChat({
        transactions,
        profile,
        requestType,
        userMessage,
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (error) {
      console.error('AI Coach error:', error);
      setIsLoading(false);
      if ((error as Error).message !== 'rate_limit' && (error as Error).message !== 'payment_required') {
        toast({
          title: t('common.error'),
          description: t('aiCoach.error.generic'),
          variant: "destructive",
        });
      }
    }
  }, [streamChat, toast, t]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
