/**
 * Receipt OCR Button - DISABLED (AI-free version)
 * This component is hidden until AI features are re-enabled
 */

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
  label?: string;
}

// Exporting types for compatibility with other components
export type { ParsedReceipt, ParsedItem };

export const ReceiptOCRButton = ({ 
  onResult, 
  disabled,
  className,
  label
}: ReceiptOCRButtonProps) => {
  // AI features are disabled - return null to hide the button
  return null;
};
