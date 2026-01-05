import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

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

  const addLoan = async (loanData: CreateLoanData): Promise<Loan | null> => {
    if (!user) return null;

    try {
      const saldoDevedor = loanData.valor_total; // Começa com valor total

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

      setLoans(prev => [data as Loan, ...prev]);
      toast({
        title: 'Empréstimo cadastrado!',
        description: 'Seu empréstimo foi registrado com sucesso.',
      });

      return data as Loan;
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
    totalSaldoDevedor,
    totalParcelasMensais,
  };
};