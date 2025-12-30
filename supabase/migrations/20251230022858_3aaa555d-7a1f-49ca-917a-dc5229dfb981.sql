-- Provision default categories for existing users who don't have them
DO $$
DECLARE
  user_record RECORD;
  categories_count INTEGER;
BEGIN
  FOR user_record IN 
    SELECT p.id FROM profiles p
  LOOP
    -- Check if user has any default categories
    SELECT COUNT(*) INTO categories_count
    FROM categories c 
    WHERE c.user_id = user_record.id AND c.is_default = true;
    
    -- If no default categories, create them
    IF categories_count = 0 THEN
      RAISE NOTICE 'Creating default categories for user: %', user_record.id;
      PERFORM public.create_default_categories(user_record.id);
    END IF;
  END LOOP;
END $$;