-- Create table for auto-generated blog articles
CREATE TABLE public.blog_articles_generated (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  keyword TEXT NOT NULL,
  read_time INTEGER NOT NULL DEFAULT 8,
  related_slugs TEXT[] DEFAULT '{}',
  internal_links JSONB DEFAULT '[]',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled'))
);

-- Enable RLS but allow public read for published articles
ALTER TABLE public.blog_articles_generated ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.blog_articles_generated
FOR SELECT
USING (status = 'published');

-- Create index for faster queries
CREATE INDEX idx_blog_articles_status ON public.blog_articles_generated(status);
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles_generated(published_at DESC);
CREATE INDEX idx_blog_articles_slug ON public.blog_articles_generated(slug);