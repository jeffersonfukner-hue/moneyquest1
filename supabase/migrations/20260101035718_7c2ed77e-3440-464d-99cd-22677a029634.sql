
-- Adicionar constraint única para prevenir categorias duplicadas
ALTER TABLE public.categories
ADD CONSTRAINT categories_user_name_type_unique UNIQUE (user_id, name, type);
