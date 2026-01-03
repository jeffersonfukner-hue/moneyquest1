import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Scan, Camera, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ParsedItem {
  name: string;
  amount: number;
  quantity?: number;
}

interface ParsedReceipt {
  storeName?: string;
  date?: string;
  total?: number;
  items: ParsedItem[];
  suggestedCategory?: string;
}

interface ReceiptOCRButtonProps {
  onResult: (data: ParsedReceipt) => void;
  disabled?: boolean;
  className?: string;
}

export const ReceiptOCRButton = ({ 
  onResult, 
  disabled,
  className 
}: ReceiptOCRButtonProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('ocr.error.invalidType', 'Tipo inválido'),
        description: t('ocr.error.imageOnly', 'Selecione uma imagem (JPG, PNG, etc.)'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('ocr.error.tooLarge', 'Arquivo muito grande'),
        description: t('ocr.error.maxSize', 'Tamanho máximo: 10MB'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call OCR function
      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: { 
          imageBase64: base64, 
          mimeType: file.type 
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        if (data.code === 'PREMIUM_REQUIRED') {
          toast({
            title: t('premium.required', 'Premium necessário'),
            description: t('premium.ocrLocked', 'A leitura de nota fiscal é exclusiva para Premium.'),
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.success && data?.data) {
        const parsed = data.data as ParsedReceipt;
        
        toast({
          title: t('ocr.success', 'Nota fiscal lida!'),
          description: t('ocr.itemsFound', '{{count}} itens encontrados', { count: parsed.items?.length || 0 }),
        });

        onResult(parsed);
      }

    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: t('ocr.error.title', 'Erro na leitura'),
        description: t('ocr.error.tryAgain', 'Não foi possível ler a nota. Tente outra foto.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={() => fileInputRef.current?.click()}
        className={cn("gap-2", className)}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('ocr.processing', 'Lendo...')}
          </>
        ) : (
          <>
            <Scan className="w-4 h-4" />
            {t('ocr.scanReceipt', 'Ler nota fiscal')}
          </>
        )}
      </Button>
    </>
  );
};
