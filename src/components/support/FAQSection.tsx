import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const FAQ_KEYS = [
  'howToAdd',
  'whatIsXP',
  'howPremium',
  'deleteAccount',
  'changeLanguage',
  'multipleWallets',
] as const;

export function FAQSection() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">{t('support.faq.title')}</h2>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {FAQ_KEYS.map((key, index) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-left text-sm">
              {t(`support.faq.items.${key}.question`)}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {t(`support.faq.items.${key}.answer`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
