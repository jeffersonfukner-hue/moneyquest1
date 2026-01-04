-- Function to notify all users when a new blog article is published
CREATE OR REPLACE FUNCTION public.notify_users_new_blog_article()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Only notify if the article status is 'published'
  IF NEW.status = 'published' THEN
    -- Insert notification for all active users
    INSERT INTO public.user_messages (user_id, title, content, message_type, is_read)
    SELECT 
      p.id,
      '📚 Novo artigo no Blog!',
      'Confira: ' || NEW.title,
      'blog',
      false
    FROM public.profiles p
    WHERE p.status IS NULL OR p.status != 'blocked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new blog articles
DROP TRIGGER IF EXISTS on_blog_article_published ON public.blog_articles_generated;
CREATE TRIGGER on_blog_article_published
  AFTER INSERT ON public.blog_articles_generated
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_new_blog_article();