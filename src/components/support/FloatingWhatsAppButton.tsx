import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { WHATSAPP_SUPPORT_NUMBER } from '@/lib/supportConfig';

export const FloatingWhatsAppButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleClick = () => {
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
