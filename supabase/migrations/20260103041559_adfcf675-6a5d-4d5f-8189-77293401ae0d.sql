-- Atualizar todas as descrições existentes para UPPERCASE
UPDATE transactions 
SET description = UPPER(description)
WHERE description != UPPER(description);

-- Função para forçar UPPERCASE em novas inserções/atualizações
CREATE OR REPLACE FUNCTION public.force_uppercase_description()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description := UPPER(NEW.description);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para garantir UPPERCASE no banco
CREATE TRIGGER ensure_uppercase_description
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION force_uppercase_description();