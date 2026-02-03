import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTransactions } from './useTransactions';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format, parseISO, differenceInDays } from 'date-fns';

// Types
export interface BankStatementLine {
  id: string;
  user_id: string;
  wallet_id: string;
  bank_reference: string | null;
  transaction_date: string;
  description: string;
  counterparty: string | null;
  amount: number;
  import_batch_id: string | null;
  imported_at: string;
  source_file_name: string | null;
  reconciliation_status: 'pending' | 'reconciled' | 'ignored' | 'created';
  created_at: string;
  updated_at: string;
}

export interface Reconciliation {
  id: string;
  user_id: string;
  bank_line_id: string;
  transaction_id: string | null;
  match_type: 'auto' | 'manual' | 'created';
  confidence_score: number | null;
  reconciled_at: string;
  reconciled_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface MatchSuggestion {
  transaction_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  matchReasons: string[];
}

export interface BankLineWithMatch extends BankStatementLine {
  suggestions: MatchSuggestion[];
  reconciliation?: Reconciliation;
  matchedTransaction?: {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  };
}

interface ImportBankLinesParams {
  walletId: string;
  lines: Array<{
    bank_reference?: string;
    transaction_date: string;
    description: string;
    counterparty?: string;
    amount: number;
    fingerprint?: string;
  }>;
  sourceFileName?: string;
}

// Generate fingerprint for deduplication
function generateFingerprint(date: string, amount: number, description: string): string {
  const normalizedDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30);
  
  return `${date}|${amount.toFixed(2)}|${normalizedDesc}`;
}

// Similarity calculation using Levenshtein distance
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= aLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[aLen][bLen];
}

function textSimilarity(a: string, b: string): number {
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  
  if (aNorm === bNorm) return 100;
  if (!aNorm || !bNorm) return 0;
  
  const maxLen = Math.max(aNorm.length, bNorm.length);
  const distance = levenshteinDistance(aNorm, bNorm);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

// Excluded transaction subtypes from reconciliation
const EXCLUDED_SUBTYPES = ['transfer_out', 'transfer_in', 'card_payment', 'cash_adjustment'];

export const useReconciliation = (walletId?: string) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { transactions: allTransactions } = useTransactions();
  
  const [bankLines, setBankLines] = useState<BankLineWithMatch[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Filter transactions for the selected wallet, excluding special types
  const walletTransactions = useMemo(() => {
    if (!walletId) return [];
    return allTransactions.filter(tx => 
      tx.wallet_id === walletId &&
      !EXCLUDED_SUBTYPES.includes(tx.transaction_subtype || '')
    );
  }, [allTransactions, walletId]);

  // Fetch bank lines and reconciliations for a wallet
  const fetchBankLines = useCallback(async () => {
    if (!user || !walletId) return;

    setLoading(true);
    try {
      // Fetch bank lines
      const { data: lines, error: linesError } = await supabase
        .from('bank_statement_lines')
        .select('*')
        .eq('user_id', user.id)
        .eq('wallet_id', walletId)
        .order('transaction_date', { ascending: false });

      if (linesError) throw linesError;

      // Fetch reconciliations
      const { data: recs, error: recsError } = await supabase
        .from('reconciliations')
        .select('*')
        .eq('user_id', user.id);

      if (recsError) throw recsError;

      const typedRecs = (recs || []).map(r => ({
        ...r,
        match_type: r.match_type as 'auto' | 'manual' | 'created',
      }));
      setReconciliations(typedRecs);

      // Enrich lines with matches
      const enrichedLines = (lines || []).map(line => {
        const typedLine = {
          ...line,
          reconciliation_status: line.reconciliation_status as 'pending' | 'reconciled' | 'ignored' | 'created',
        };
        const lineRec = typedRecs.find(r => r.bank_line_id === line.id);
        const matchedTx = lineRec?.transaction_id 
          ? walletTransactions.find(tx => tx.id === lineRec.transaction_id)
          : undefined;

        // Calculate suggestions for pending lines
        const suggestions = typedLine.reconciliation_status === 'pending'
          ? calculateSuggestions(typedLine, walletTransactions)
          : [];

        return {
          ...typedLine,
          suggestions,
          reconciliation: lineRec,
          matchedTransaction: matchedTx ? {
            id: matchedTx.id,
            description: matchedTx.description,
            amount: matchedTx.amount,
            date: matchedTx.date,
            category: matchedTx.category,
          } : undefined,
        } as BankLineWithMatch;
      });

      setBankLines(enrichedLines);
    } catch (error) {
      console.error('Error fetching bank lines:', error);
      toast.error(t('reconciliation.fetchError', 'Erro ao carregar linhas do extrato'));
    } finally {
      setLoading(false);
    }
  }, [user, walletId, walletTransactions, t]);

  useEffect(() => {
    if (walletId) {
      fetchBankLines();
    }
  }, [walletId, fetchBankLines]);

  // Calculate match suggestions for a bank line
  const calculateSuggestions = (
    bankLine: BankStatementLine,
    transactions: typeof allTransactions
  ): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = [];
    const bankAmount = Math.abs(bankLine.amount);
    const bankDate = parseISO(bankLine.transaction_date);
    const bankType = bankLine.amount >= 0 ? 'INCOME' : 'EXPENSE';

    for (const tx of transactions) {
      // Skip if already reconciled
      if (reconciliations.some(r => r.transaction_id === tx.id)) continue;

      // Must match type (income/expense)
      if (tx.type !== bankType) continue;

      let confidence = 0;
      const matchReasons: string[] = [];

      // Amount match (exact = 40 points, tolerance = 20 points)
      const txAmount = Math.abs(tx.amount);
      const amountDiff = Math.abs(bankAmount - txAmount);
      const amountTolerance = bankAmount * 0.01; // 1% tolerance

      if (amountDiff === 0) {
        confidence += 40;
        matchReasons.push(t('reconciliation.exactAmount', 'Valor exato'));
      } else if (amountDiff <= amountTolerance) {
        confidence += 20;
        matchReasons.push(t('reconciliation.closeAmount', 'Valor próximo'));
      } else {
        // Skip if amount doesn't match at all
        continue;
      }

      // Date match (same day = 30, ±3 days = 15, ±7 days = 5)
      const txDate = parseISO(tx.date);
      const daysDiff = Math.abs(differenceInDays(bankDate, txDate));

      if (daysDiff === 0) {
        confidence += 30;
        matchReasons.push(t('reconciliation.sameDate', 'Mesma data'));
      } else if (daysDiff <= 3) {
        confidence += 15;
        matchReasons.push(t('reconciliation.closeDateRange', '±3 dias'));
      } else if (daysDiff <= 7) {
        confidence += 5;
        matchReasons.push(t('reconciliation.wideDateRange', '±7 dias'));
      } else {
        // Skip if date is too far
        continue;
      }

      // Text similarity (description/counterparty)
      const descSimilarity = textSimilarity(bankLine.description, tx.description);
      const counterpartySimilarity = bankLine.counterparty 
        ? textSimilarity(bankLine.counterparty, tx.supplier || tx.description)
        : 0;
      const maxTextSimilarity = Math.max(descSimilarity, counterpartySimilarity);

      if (maxTextSimilarity >= 80) {
        confidence += 30;
        matchReasons.push(t('reconciliation.highTextMatch', 'Descrição similar'));
      } else if (maxTextSimilarity >= 50) {
        confidence += 15;
        matchReasons.push(t('reconciliation.partialTextMatch', 'Descrição parcial'));
      }

      // Only include if confidence is reasonable
      if (confidence >= 40) {
        suggestions.push({
          transaction_id: tx.id,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          category: tx.category,
          confidence,
          matchReasons,
        });
      }
    }

    // Sort by confidence descending
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  };

  // Get existing fingerprints for deduplication
  const getExistingFingerprints = useCallback(async (targetWalletId: string): Promise<Set<string>> => {
    if (!user) return new Set();

    try {
      const { data, error } = await supabase
        .from('bank_statement_lines')
        .select('transaction_date, amount, description')
        .eq('user_id', user.id)
        .eq('wallet_id', targetWalletId);

      if (error) throw error;

      const fingerprints = new Set<string>();
      (data || []).forEach(line => {
        const fp = generateFingerprint(line.transaction_date, line.amount, line.description);
        fingerprints.add(fp);
      });

      return fingerprints;
    } catch (error) {
      console.error('Error fetching fingerprints:', error);
      return new Set();
    }
  }, [user]);

  // Import bank lines from parsed data with deduplication
  const importBankLines = async ({ walletId: targetWalletId, lines, sourceFileName }: ImportBankLinesParams): Promise<boolean> => {
    if (!user) return false;

    setImporting(true);
    try {
      const batchId = crypto.randomUUID();

      const insertData = lines.map(line => {
        // Generate fingerprint if not provided
        const fingerprint = line.fingerprint || generateFingerprint(
          line.transaction_date, 
          line.amount, 
          line.description
        );
        
        return {
          user_id: user.id,
          wallet_id: targetWalletId,
          bank_reference: line.bank_reference || null,
          transaction_date: line.transaction_date,
          description: line.description,
          counterparty: line.counterparty || null,
          amount: line.amount,
          import_batch_id: batchId,
          source_file_name: sourceFileName || null,
          reconciliation_status: 'pending' as const,
        };
      });

      const { error } = await supabase
        .from('bank_statement_lines')
        .insert(insertData);

      if (error) throw error;

      toast.success(t('reconciliation.importSuccess', '{{count}} linhas importadas', { count: lines.length }));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error importing bank lines:', error);
      toast.error(t('reconciliation.importError', 'Erro ao importar extrato'));
      return false;
    } finally {
      setImporting(false);
    }
  };

  // Reconcile a bank line with an existing transaction
  const reconcileWithTransaction = async (
    bankLineId: string,
    transactionId: string,
    matchType: 'auto' | 'manual' = 'manual',
    confidenceScore?: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Create reconciliation record
      const { error: recError } = await supabase
        .from('reconciliations')
        .insert({
          user_id: user.id,
          bank_line_id: bankLineId,
          transaction_id: transactionId,
          match_type: matchType,
          confidence_score: confidenceScore || null,
          reconciled_by: user.id,
        });

      if (recError) throw recError;

      // Update bank line status
      const { error: updateError } = await supabase
        .from('bank_statement_lines')
        .update({ 
          reconciliation_status: 'reconciled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankLineId);

      if (updateError) throw updateError;

      toast.success(t('reconciliation.reconcileSuccess', 'Conciliado com sucesso'));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error reconciling:', error);
      toast.error(t('reconciliation.reconcileError', 'Erro ao conciliar'));
      return false;
    }
  };

  // Create a new transaction from bank line
  const createTransactionFromLine = async (
    bankLineId: string,
    category: string,
    supplier?: string
  ): Promise<boolean> => {
    if (!user || !walletId) return false;

    const bankLine = bankLines.find(l => l.id === bankLineId);
    if (!bankLine) return false;

    try {
      // Create the transaction
      const txType = bankLine.amount >= 0 ? 'INCOME' : 'EXPENSE';
      
      const { data: newTx, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          description: bankLine.description.toUpperCase(),
          amount: Math.abs(bankLine.amount),
          category,
          type: txType,
          date: bankLine.transaction_date,
          wallet_id: walletId,
          source_type: 'account',
          supplier: supplier || bankLine.counterparty || null,
        })
        .select()
        .single();

      if (txError) throw txError;

      // Create reconciliation record
      const { error: recError } = await supabase
        .from('reconciliations')
        .insert({
          user_id: user.id,
          bank_line_id: bankLineId,
          transaction_id: newTx.id,
          match_type: 'created',
          reconciled_by: user.id,
        });

      if (recError) throw recError;

      // Update bank line status
      const { error: updateError } = await supabase
        .from('bank_statement_lines')
        .update({ 
          reconciliation_status: 'created',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankLineId);

      if (updateError) throw updateError;

      toast.success(t('reconciliation.createSuccess', 'Transação criada e conciliada'));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(t('reconciliation.createError', 'Erro ao criar transação'));
      return false;
    }
  };

  // Ignore a bank line (mark as ignored)
  const ignoreBankLine = async (bankLineId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_statement_lines')
        .update({ 
          reconciliation_status: 'ignored',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankLineId);

      if (error) throw error;

      toast.success(t('reconciliation.ignoreSuccess', 'Linha ignorada'));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error ignoring line:', error);
      toast.error(t('reconciliation.ignoreError', 'Erro ao ignorar'));
      return false;
    }
  };

  // Undo reconciliation (set back to pending)
  const undoReconciliation = async (bankLineId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Delete reconciliation record
      const { error: delError } = await supabase
        .from('reconciliations')
        .delete()
        .eq('bank_line_id', bankLineId);

      if (delError) throw delError;

      // Set status back to pending
      const { error: updateError } = await supabase
        .from('bank_statement_lines')
        .update({ 
          reconciliation_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankLineId);

      if (updateError) throw updateError;

      toast.success(t('reconciliation.undoSuccess', 'Conciliação desfeita'));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error undoing reconciliation:', error);
      toast.error(t('reconciliation.undoError', 'Erro ao desfazer'));
      return false;
    }
  };

  // Delete bank lines by batch
  const deleteBatch = async (batchId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_statement_lines')
        .delete()
        .eq('import_batch_id', batchId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('reconciliation.batchDeleted', 'Importação removida'));
      await fetchBankLines();
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error(t('reconciliation.deleteError', 'Erro ao remover'));
      return false;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = bankLines.length;
    const pending = bankLines.filter(l => l.reconciliation_status === 'pending').length;
    const reconciled = bankLines.filter(l => l.reconciliation_status === 'reconciled').length;
    const created = bankLines.filter(l => l.reconciliation_status === 'created').length;
    const ignored = bankLines.filter(l => l.reconciliation_status === 'ignored').length;

    const totalIncome = bankLines
      .filter(l => l.amount > 0)
      .reduce((sum, l) => sum + l.amount, 0);
    const totalExpense = bankLines
      .filter(l => l.amount < 0)
      .reduce((sum, l) => sum + Math.abs(l.amount), 0);

    return {
      total,
      pending,
      reconciled,
      created,
      ignored,
      totalIncome,
      totalExpense,
      percentReconciled: total > 0 ? Math.round(((reconciled + created) / total) * 100) : 0,
    };
  }, [bankLines]);

  return {
    bankLines,
    loading,
    importing,
    stats,
    importBankLines,
    getExistingFingerprints,
    reconcileWithTransaction,
    createTransactionFromLine,
    ignoreBankLine,
    undoReconciliation,
    deleteBatch,
    refetch: fetchBankLines,
  };
};
