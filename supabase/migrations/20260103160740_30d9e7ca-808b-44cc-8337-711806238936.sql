-- Create blog comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by article
CREATE INDEX idx_blog_comments_article ON public.blog_comments(article_slug);
CREATE INDEX idx_blog_comments_user ON public.blog_comments(user_id);

-- Enable RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved, non-hidden comments
CREATE POLICY "Anyone can view approved comments"
ON public.blog_comments
FOR SELECT
USING (is_approved = true AND is_hidden = false);

-- Authenticated users can view their own comments (even if not approved)
CREATE POLICY "Users can view own comments"
ON public.blog_comments
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.blog_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.blog_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.blog_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can manage all comments
CREATE POLICY "Admins can manage all comments"
ON public.blog_comments
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create function to filter offensive words
CREATE OR REPLACE FUNCTION public.filter_offensive_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  offensive_words TEXT[] := ARRAY[
    'idiota', 'burro', 'imbecil', 'merda', 'porra', 'caralho', 'foda-se',
    'puta', 'vagabunda', 'cuzão', 'viado', 'bicha', 'retardado',
    'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'dick', 'pussy'
  ];
  word TEXT;
  content_lower TEXT;
BEGIN
  content_lower := LOWER(NEW.content);
  
  FOREACH word IN ARRAY offensive_words
  LOOP
    IF content_lower LIKE '%' || word || '%' THEN
      -- Hide the comment but still save it for review
      NEW.is_hidden := true;
      NEW.is_approved := false;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to filter content on insert/update
CREATE TRIGGER filter_comment_content
BEFORE INSERT OR UPDATE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.filter_offensive_content();

-- Create function to update timestamp
CREATE TRIGGER update_blog_comments_updated_at
BEFORE UPDATE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();