import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  isInvoicePayment: boolean;
  suggestedCardMatch?: string;
  // User selections
  selected: boolean;
  category?: string;
  walletId?: string;
  creditCardId?: string;
  linkToCard: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
}

export const useBankStatementImport = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<void> => {
    setLoading(true);
    setError(null);
    setTransactions([]);

    try {
      const fileName = file.name.toLowerCase();
      let type: 'csv' | 'text' | 'pdf';
      let content: string;

      if (fileName.endsWith('.csv')) {
        type = 'csv';
        content = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        type = 'pdf';
        const buffer = await file.arrayBuffer();
        content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.ofx')) {
        type = 'text';
        content = await file.text();
      } else {
        throw new Error(t('import.unsupportedFormat', 'Formato não suportado. Use CSV, TXT ou PDF.'));
      }

      console.log(`Parsing ${type} file: ${fileName}`);

      const { data, error: fnError } = await supabase.functions.invoke('parse-bank-statement', {
        body: { content, type, fileName },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const parsed: ParsedTransaction[] = (data.transactions || []).map((tx: Omit<ParsedTransaction, 'id' | 'selected' | 'linkToCard'>, index: number) => ({
        ...tx,
        id: `import-${index}-${Date.now()}`,
        selected: true,
        linkToCard: tx.isInvoicePayment,
      }));

      setTransactions(parsed);
      
      if (parsed.length === 0) {
        toast({
          title: t('import.noTransactions', 'Nenhuma transação encontrada'),
          description: t('import.checkFormat', 'Verifique o formato do arquivo.'),
          variant: 'destructive',
        });
      } else {
        const invoiceCount = parsed.filter(t => t.isInvoicePayment).length;
        toast({
          title: t('import.success', 'Extrato processado'),
          description: invoiceCount > 0 
            ? t('import.foundWithInvoices', '{{count}} transações encontradas, {{invoices}} pagamentos de fatura detectados.', { count: parsed.length, invoices: invoiceCount })
            : t('import.found', '{{count}} transações encontradas.', { count: parsed.length }),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: t('import.error', 'Erro ao processar'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const parseText = async (text: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setTransactions([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('parse-bank-statement', {
        body: { content: text, type: 'text', fileName: 'pasted-text.txt' },
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      const parsed: ParsedTransaction[] = (data.transactions || []).map((tx: Omit<ParsedTransaction, 'id' | 'selected' | 'linkToCard'>, index: number) => ({
        ...tx,
        id: `import-${index}-${Date.now()}`,
        selected: true,
        linkToCard: tx.isInvoicePayment,
      }));

      setTransactions(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, selected: !tx.selected } : tx)
    );
  };

  const toggleAll = (selected: boolean) => {
    setTransactions(prev => prev.map(tx => ({ ...tx, selected })));
  };

  const updateTransaction = (id: string, updates: Partial<ParsedTransaction>) => {
    setTransactions(prev =>
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  };

  const linkInvoiceToCard = (transactionId: string, cardId: string) => {
    setTransactions(prev =>
      prev.map(tx => tx.id === transactionId 
        ? { ...tx, creditCardId: cardId, linkToCard: true }
        : tx
      )
    );
  };

  const getSelectedTransactions = () => transactions.filter(tx => tx.selected);

  const reset = () => {
    setTransactions([]);
    setError(null);
  };

  return {
    loading,
    transactions,
    error,
    parseFile,
    parseText,
    toggleTransaction,
    toggleAll,
    updateTransaction,
    linkInvoiceToCard,
    getSelectedTransactions,
    reset,
  };
};
