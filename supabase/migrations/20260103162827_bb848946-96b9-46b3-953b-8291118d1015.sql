-- Create table for comment likes
CREATE TABLE public.blog_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (for counting)
CREATE POLICY "Anyone can view likes" 
ON public.blog_comment_likes 
FOR SELECT 
USING (true);

-- Users can add their own likes
CREATE POLICY "Users can add likes" 
ON public.blog_comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can remove own likes" 
ON public.blog_comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_blog_comment_likes_comment_id ON public.blog_comment_likes(comment_id);
CREATE INDEX idx_blog_comment_likes_user_id ON public.blog_comment_likes(user_id);