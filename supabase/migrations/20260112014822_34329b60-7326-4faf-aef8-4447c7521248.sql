-- Create storage bucket for OG images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('og-images', 'og-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create public read policy for og-images bucket
CREATE POLICY "Public Access for OG Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

-- Allow service role to upload images
CREATE POLICY "Service Role Upload OG Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'og-images');

-- Allow service role to update/overwrite images
CREATE POLICY "Service Role Update OG Images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'og-images');