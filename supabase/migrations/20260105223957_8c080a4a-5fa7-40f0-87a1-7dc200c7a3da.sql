-- ETAPA 1: Tabela de Empréstimos (sem impacto em saldo/orçamento)

-- Criar tabela de empréstimos
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Dados do empréstimo
  valor_total NUMERIC NOT NULL,
  tipo_emprestimo TEXT NOT NULL CHECK (tipo_emprestimo IN ('pessoal', 'financiamento', 'consignado', 'informal', 'parcelamento')),
  instituicao_pessoa TEXT NOT NULL,
  data_contratacao DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Parcelas
  quantidade_parcelas INTEGER NOT NULL CHECK (quantidade_parcelas > 0),
  valor_parcela NUMERIC NOT NULL CHECK (valor_parcela > 0),
  taxa_juros NUMERIC DEFAULT NULL, -- Taxa em percentual (ex: 2.5 = 2.5% ao mês)
  primeiro_vencimento DATE NOT NULL,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado')),
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  saldo_devedor NUMERIC NOT NULL, -- Calculado: valor_total - (parcelas_pagas * valor_parcela)
  
  -- Opções do usuário
  debitar_automaticamente BOOLEAN NOT NULL DEFAULT false,
  enviar_lembrete BOOLEAN NOT NULL DEFAULT true,
  considerar_orcamento BOOLEAN NOT NULL DEFAULT true,
  
  -- Moeda (herda do sistema)
  currency TEXT NOT NULL DEFAULT 'BRL',
  
  -- Metadados
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mesmo padrão do cartão de crédito)
CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_primeiro_vencimento ON public.loans(primeiro_vencimento);

-- Comentários para documentação
COMMENT ON TABLE public.loans IS 'Tabela de empréstimos do usuário - ETAPA 1 do módulo de empréstimos';
COMMENT ON COLUMN public.loans.tipo_emprestimo IS 'Tipo: pessoal, financiamento, consignado, informal, parcelamento';
COMMENT ON COLUMN public.loans.taxa_juros IS 'Taxa de juros mensal em percentual (ex: 2.5 = 2.5%)';
COMMENT ON COLUMN public.loans.saldo_devedor IS 'Saldo restante a pagar';