import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { AvatarDisplay } from './AvatarDisplay';

interface AvatarUploadProps {
  currentUrl: string | null | undefined;
  fallbackEmoji: string;
  onUploadComplete: (url: string) => void;
  onDelete: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const AvatarUpload = ({
  currentUrl,
  fallbackEmoji,
  onUploadComplete,
  onDelete,
}: AvatarUploadProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to resize image'));
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: t('profile.photoFormats'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('common.error'),
        description: t('profile.photoSizeLimit'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Resize image
      const resizedBlob = await resizeImage(file);
      
      // Generate unique filename
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // Delete old avatar if exists
      if (currentUrl) {
        const oldPath = currentUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onUploadComplete(urlData.publicUrl);
      
      toast({
        title: t('common.success'),
        description: t('profile.photoUploadSuccess'),
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('common.error'),
        description: t('profile.photoUploadError'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentUrl || !user) return;

    setDeleting(true);

    try {
      const path = currentUrl.split('/avatars/')[1];
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
      
      onDelete();
      
      toast({
        title: t('common.success'),
        description: t('profile.photoUploadSuccess'),
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t('common.error'),
        description: t('profile.photoUploadError'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <AvatarDisplay
          avatarUrl={currentUrl}
          avatarIcon={fallbackEmoji}
          size="xl"
          className="border-4"
        />
        
        {/* Upload overlay button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {t('profile.uploadPhoto')}
        </Button>

        {currentUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {t('profile.removePhoto')}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t('profile.photoFormats')}<br />
        {t('profile.photoSizeLimit')}
      </p>
    </div>
  );
};
