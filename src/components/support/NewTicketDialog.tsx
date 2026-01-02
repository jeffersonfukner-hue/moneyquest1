import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Paperclip, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSupportTickets } from '@/hooks/useSupportTickets';

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = ['question', 'technical', 'suggestion', 'financial', 'other'] as const;

export function NewTicketDialog({ open, onOpenChange }: NewTicketDialogProps) {
  const { t } = useTranslation();
  const { createTicket, isUploading } = useSupportTickets();
  const [attachment, setAttachment] = useState<File | null>(null);

  const ticketSchema = z.object({
    subject: z.string()
      .min(5, t('validation.minLength', { count: 5 }))
      .max(100, t('validation.maxLength', { count: 100 })),
    category: z.enum(CATEGORIES),
    message: z.string()
      .min(10, t('validation.minLength', { count: 10 }))
      .max(2000, t('validation.maxLength', { count: 2000 })),
  });

  type TicketFormData = z.infer<typeof ticketSchema>;

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: 'question',
      message: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const onSubmit = async (data: TicketFormData) => {
    await createTicket.mutateAsync({
      subject: data.subject,
      category: data.category,
      message: data.message,
      attachment: attachment || undefined,
    });
    
    form.reset();
    setAttachment(null);
    onOpenChange(false);
  };

  const isLoading = createTicket.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('support.newTicket')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('support.form.subject')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('support.form.subjectPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('support.form.category')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('support.form.category')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t(`support.categories.${cat}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('support.form.message')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('support.form.messagePlaceholder')} 
                      className="min-h-[120px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachment */}
            <div className="space-y-2">
              <Label>{t('support.form.attachment')}</Label>
              {attachment ? (
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                  <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={removeAttachment}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <Paperclip className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">
                      {t('support.form.attachmentHint')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('support.form.send')
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
