import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { addMonths, format } from 'date-fns';

export interface Loan {
  id: string;
  user_id: string;
  valor_total: number;
  tipo_emprestimo: 'pessoal' | 'financiamento' | 'consignado' | 'informal' | 'parcelamento';
  instituicao_pessoa: string;
  data_contratacao: string;
  quantidade_parcelas: number;
  valor_parcela: number;
  taxa_juros: number | null;
  primeiro_vencimento: string;
  status: 'ativo' | 'quitado';
  parcelas_pagas: number;
  saldo_devedor: number;
  debitar_automaticamente: boolean;
  enviar_lembrete: boolean;
  considerar_orcamento: boolean;
  currency: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanData {
  valor_total: number;
  tipo_emprestimo: Loan['tipo_emprestimo'];
  instituicao_pessoa: string;
  data_contratacao?: string;
  quantidade_parcelas: number;
  valor_parcela: number;
  taxa_juros?: number | null;
  primeiro_vencimento: string;
  debitar_automaticamente?: boolean;
  enviar_lembrete?: boolean;
  considerar_orcamento?: boolean;
  currency?: string;
  notas?: string | null;
}

export interface UpdateLoanData {
  valor_total?: number;
  tipo_emprestimo?: Loan['tipo_emprestimo'];
  instituicao_pessoa?: string;
  quantidade_parcelas?: number;
  valor_parcela?: number;
  taxa_juros?: number | null;
  primeiro_vencimento?: string;
  status?: Loan['status'];
  parcelas_pagas?: number;
  saldo_devedor?: number;
  debitar_automaticamente?: boolean;
  enviar_lembrete?: boolean;
  considerar_orcamento?: boolean;
  notas?: string | null;
}

export const useLoans = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans((data || []) as Loan[]);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Ensure loan category exists for expense transactions
  const ensureLoanCategory = async (): Promise<string> => {
    if (!user) return 'Empréstimos';
    
    // Check if category exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('type', 'EXPENSE')
      .ilike('name', 'Empréstimos')
      .maybeSingle();
    
    if (existing) return existing.name;
    
    // Create category if not exists
    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: 'Empréstimos',
        type: 'EXPENSE',
        icon: '🏦',
        color: '#DC2626',
        is_default: false,
      })
      .select('name')
      .single();
    
    if (error) {
      console.error('Error creating loan category:', error);
      return 'Empréstimos';
    }
    
    return created?.name || 'Empréstimos';
  };

  // Generate installment transactions for a loan
  const generateInstallments = async (loan: Loan, categoryName: string): Promise<void> => {
    if (!user) return;
    
    const installments = [];
    const firstDueDate = new Date(loan.primeiro_vencimento + 'T00:00:00');
    
    for (let i = 0; i < loan.quantidade_parcelas; i++) {
      const dueDate = addMonths(firstDueDate, i);
      const dateStr = format(dueDate, 'yyyy-MM-dd');
      
      installments.push({
        user_id: user.id,
        amount: loan.valor_parcela,
        category: categoryName,
        description: `${loan.instituicao_pessoa.toUpperCase()} - PARCELA ${i + 1}/${loan.quantidade_parcelas}`,
        date: dateStr,
        type: 'EXPENSE',
        currency: loan.currency,
        is_manual: true,
        source_type: 'loan',
        transaction_subtype: `loan:${loan.id}:${i + 1}`,
        xp_earned: 0, // No XP for auto-generated installments
      });
    }
    
    const { error } = await supabase
      .from('transactions')
      .insert(installments);
    
    if (error) {
      console.error('Error generating installments:', error);
      throw error;
    }
  };

  const addLoan = async (loanData: CreateLoanData): Promise<Loan | null> => {
    if (!user) return null;

    try {
      const saldoDevedor = loanData.valor_total;
      const categoryName = await ensureLoanCategory();

      const { data, error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          valor_total: loanData.valor_total,
          tipo_emprestimo: loanData.tipo_emprestimo,
          instituicao_pessoa: loanData.instituicao_pessoa,
          data_contratacao: loanData.data_contratacao || new Date().toISOString().split('T')[0],
          quantidade_parcelas: loanData.quantidade_parcelas,
          valor_parcela: loanData.valor_parcela,
          taxa_juros: loanData.taxa_juros || null,
          primeiro_vencimento: loanData.primeiro_vencimento,
          saldo_devedor: saldoDevedor,
          debitar_automaticamente: loanData.debitar_automaticamente ?? false,
          enviar_lembrete: loanData.enviar_lembrete ?? true,
          considerar_orcamento: loanData.considerar_orcamento ?? true,
          currency: loanData.currency || 'BRL',
          notas: loanData.notas || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newLoan = data as Loan;
      
      // Generate installment transactions
      await generateInstallments(newLoan, categoryName);

      setLoans(prev => [newLoan, ...prev]);
      toast({
        title: 'Empréstimo cadastrado!',
        description: `${loanData.quantidade_parcelas} parcelas foram geradas automaticamente.`,
      });

      return newLoan;
    } catch (error) {
      console.error('Error adding loan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar o empréstimo.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLoan = async (id: string, updates: UpdateLoanData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setLoans(prev =>
        prev.map(loan => loan.id === id ? { ...loan, ...updates } : loan)
      );

      toast({
        title: 'Empréstimo atualizado!',
      });

      return true;
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o empréstimo.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLoan = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLoans(prev => prev.filter(loan => loan.id !== id));
      toast({
        title: 'Empréstimo removido!',
      });

      return true;
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o empréstimo.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Pay a specific installment
  const payInstallment = async (loanId: string, installmentNumber: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return false;

      // Update the loan: increment parcelas_pagas, decrease saldo_devedor
      const newParcelasPagas = loan.parcelas_pagas + 1;
      const newSaldoDevedor = Math.max(0, loan.saldo_devedor - loan.valor_parcela);
      const newStatus = newParcelasPagas >= loan.quantidade_parcelas ? 'quitado' : 'ativo';

      const { error } = await supabase
        .from('loans')
        .update({
          parcelas_pagas: newParcelasPagas,
          saldo_devedor: newSaldoDevedor,
          status: newStatus,
        })
        .eq('id', loanId);

      if (error) throw error;

      setLoans(prev =>
        prev.map(l => l.id === loanId ? {
          ...l,
          parcelas_pagas: newParcelasPagas,
          saldo_devedor: newSaldoDevedor,
          status: newStatus as 'ativo' | 'quitado',
        } : l)
      );

      toast({
        title: 'Parcela paga!',
        description: newStatus === 'quitado' 
          ? '🎉 Parabéns! Empréstimo quitado!' 
          : `Parcela ${installmentNumber} registrada. Faltam ${loan.quantidade_parcelas - newParcelasPagas}.`,
      });

      // Check for badge unlocks
      await checkLoanBadges();

      return true;
    } catch (error) {
      console.error('Error paying installment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Check and unlock loan badges
  const checkLoanBadges = async (): Promise<{ name: string; icon: string }[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('check_loan_badges', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error checking loan badges:', error);
        return [];
      }

      const unlockedBadges = (data || []).filter((b: { unlocked: boolean }) => b.unlocked);
      
      // Show toast for each unlocked badge
      unlockedBadges.forEach((badge: { badge_name: string; badge_icon: string }) => {
        toast({
          title: `${badge.badge_icon} Conquista Desbloqueada!`,
          description: badge.badge_name,
        });
      });

      return unlockedBadges.map((b: { badge_name: string; badge_icon: string }) => ({
        name: b.badge_name,
        icon: b.badge_icon
      }));
    } catch (error) {
      console.error('Error checking loan badges:', error);
      return [];
    }
  };

  // Prepay multiple installments at once
  const prepayInstallments = async (loanId: string, numberOfInstallments: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return false;

      const remainingInstallments = loan.quantidade_parcelas - loan.parcelas_pagas;
      const installmentsToPay = Math.min(numberOfInstallments, remainingInstallments);

      if (installmentsToPay <= 0) return false;

      const newParcelasPagas = loan.parcelas_pagas + installmentsToPay;
      const newSaldoDevedor = Math.max(0, loan.saldo_devedor - (loan.valor_parcela * installmentsToPay));
      const newStatus = newParcelasPagas >= loan.quantidade_parcelas ? 'quitado' : 'ativo';

      const { error } = await supabase
        .from('loans')
        .update({
          parcelas_pagas: newParcelasPagas,
          saldo_devedor: newSaldoDevedor,
          status: newStatus,
        })
        .eq('id', loanId);

      if (error) throw error;

      setLoans(prev =>
        prev.map(l => l.id === loanId ? {
          ...l,
          parcelas_pagas: newParcelasPagas,
          saldo_devedor: newSaldoDevedor,
          status: newStatus as 'ativo' | 'quitado',
        } : l)
      );

      toast({
        title: 'Parcelas antecipadas!',
        description: newStatus === 'quitado' 
          ? '🎉 Parabéns! Empréstimo quitado!' 
          : `${installmentsToPay} parcela(s) antecipada(s) com sucesso.`,
      });

      // Check for badge unlocks if loan was paid off
      if (newStatus === 'quitado') {
        await checkLoanBadges();
      }

      return true;
    } catch (error) {
      console.error('Error prepaying installments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível antecipar as parcelas.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Fully pay off the loan
  const payOffLoan = async (loanId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return false;

      const { error } = await supabase
        .from('loans')
        .update({
          parcelas_pagas: loan.quantidade_parcelas,
          saldo_devedor: 0,
          status: 'quitado',
        })
        .eq('id', loanId);

      if (error) throw error;

      setLoans(prev =>
        prev.map(l => l.id === loanId ? {
          ...l,
          parcelas_pagas: l.quantidade_parcelas,
          saldo_devedor: 0,
          status: 'quitado' as const,
        } : l)
      );

      toast({
        title: '🎉 Empréstimo quitado!',
        description: 'Parabéns por quitar essa dívida!',
      });

      // Check for badge unlocks
      await checkLoanBadges();

      return true;
    } catch (error) {
      console.error('Error paying off loan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível quitar o empréstimo.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get installments for a specific loan
  const getLoanInstallments = useCallback(async (loanId: string) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .like('transaction_subtype', `loan:${loanId}:%`)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching installments:', error);
      return [];
    }

    return data || [];
  }, [user]);

  const activeLoans = loans.filter(l => l.status === 'ativo');
  const paidLoans = loans.filter(l => l.status === 'quitado');

  // Cálculos úteis
  const totalSaldoDevedor = activeLoans.reduce((sum, l) => sum + Number(l.saldo_devedor), 0);
  const totalParcelasMensais = activeLoans.reduce((sum, l) => sum + Number(l.valor_parcela), 0);

  return {
    loans,
    activeLoans,
    paidLoans,
    loading,
    refetch: fetchLoans,
    addLoan,
    updateLoan,
    deleteLoan,
    payInstallment,
    prepayInstallments,
    payOffLoan,
    getLoanInstallments,
    totalSaldoDevedor,
    totalParcelasMensais,
  };
};