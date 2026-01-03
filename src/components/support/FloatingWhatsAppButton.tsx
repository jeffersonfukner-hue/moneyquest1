import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { WHATSAPP_SUPPORT_NUMBER } from '@/lib/supportConfig';
import { buildWaMeChatUrl } from '@/lib/whatsapp';

export const FloatingWhatsAppButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const baseMessage = t('support.whatsapp.defaultMessage');
  const userInfo = user 
    ? `\n\n---\n${t('support.whatsapp.userInfo')}\nEmail: ${user.email || 'N/A'}\nID: ${user.id.substring(0, 8)}...`
    : '';
  
  const whatsappUrl = buildWaMeChatUrl({
    phoneE164: WHATSAPP_SUPPORT_NUMBER,
    text: baseMessage + userInfo,
  });

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
      aria-label={t('support.whatsapp.title')}
    >
      <FaWhatsapp className="w-7 h-7" />
    </a>
  );
};
