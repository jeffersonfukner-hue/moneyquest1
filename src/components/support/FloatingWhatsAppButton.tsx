import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { WHATSAPP_SUPPORT_NUMBER } from '@/lib/supportConfig';
import { supabase } from '@/integrations/supabase/client';

export const FloatingWhatsAppButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const trackWhatsAppClick = async () => {
    try {
      await supabase.from('ab_test_events').insert([{
        user_id: user?.id || null,
        test_name: 'whatsapp_click',
        variant: 'floating_button',
        event_type: 'click',
        metadata: { location: 'floating_button' }
      }]);
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }
  };

  const handleClick = () => {
    trackWhatsAppClick();
    
    const userEmail = user?.email || 'N/A';
    const userId = user?.id ? user.id.substring(0, 8) + '...' : 'N/A';
    const message = `Olá, estou entrando em contato pelo MoneyQuest e preciso de ajuda.\n\n---\nInformações do usuário:\nEmail: ${userEmail}\nID: ${userId}`;
    
    window.open(
      `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
      aria-label={t('support.whatsapp.title')}
    >
      <FaWhatsapp className="w-7 h-7" />
    </button>
  );
};
