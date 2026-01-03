-- Create storage bucket for admin user backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-backups', 'admin-backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for admin-backups bucket
CREATE POLICY "Super admins can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-backups' AND
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-backups' AND
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-backups' AND
  public.is_super_admin(auth.uid())
);