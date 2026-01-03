-- Add parent_id column for nested replies
ALTER TABLE public.blog_comments 
ADD COLUMN parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_id);

-- Add index for article lookups
CREATE INDEX idx_blog_comments_article_slug ON public.blog_comments(article_slug);