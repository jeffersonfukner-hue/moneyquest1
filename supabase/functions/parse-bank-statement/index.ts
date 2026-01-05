const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  isInvoicePayment: boolean;
  suggestedCardMatch?: string;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  errors?: string[];
}

// Common patterns for invoice payments in Brazilian banks
const INVOICE_PAYMENT_PATTERNS = [
  /pagamento.*fatura/i,
  /fatura.*cart[aã]o/i,
  /pag.*fat.*cart/i,
  /pgto.*fatura/i,
  /cart[aã]o.*cr[eé]dito/i,
  /credit.*card.*payment/i,
  /invoice.*payment/i,
];

function isInvoicePayment(description: string): boolean {
  return INVOICE_PAYMENT_PATTERNS.some(pattern => pattern.test(description));
}

function extractCardNameFromDescription(description: string): string | undefined {
  const bankPatterns = [
    /sicredi/i, /nubank/i, /inter/i, /itau/i, /itaú/i, /bradesco/i,
    /santander/i, /caixa/i, /bb|banco do brasil/i, /c6/i, /original/i,
    /picpay/i, /mercado pago/i, /pagbank/i, /neon/i, /next/i,
  ];
  
  for (const pattern of bankPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return undefined;
}

function parseDate(dateStr: string): string {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    let year = match[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

function parseAmount(amountStr: string): { value: number; isNegative: boolean } {
  // Clean the string
  let cleaned = amountStr.replace(/[R$\s]/g, '').trim();
  const isNegative = cleaned.startsWith('-') || cleaned.includes('D') || cleaned.includes('DEB');
  cleaned = cleaned.replace(/[-+CD]/gi, '').trim();
  
  // Handle Brazilian format (1.234,56) vs US format (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Check which comes last
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Brazilian format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Could be 1234,56 (decimal comma) or 1,234 (thousand separator)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal comma
      cleaned = cleaned.replace(',', '.');
    } else {
      // Thousand separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  const value = parseFloat(cleaned);
  return { value: isNaN(value) ? 0 : Math.abs(value), isNegative };
}

function parseCSVContent(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];
  
  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('data') || 
                     lines[0]?.toLowerCase().includes('date') ||
                     lines[0]?.toLowerCase().includes('descrição') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Try different CSV separators
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/"/g, ''));
    
    if (parts.length >= 2) {
      let date = '';
      let description = '';
      let amount = 0;
      let isExpense = false;
      
      for (const part of parts) {
        // Check if it's a date
        if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(part)) {
          date = parseDate(part);
        }
        // Check if it's a number (amount)
        else if (/^-?[\d.,]+$/.test(part.replace(/[R$\s]/g, ''))) {
          const { value, isNegative } = parseAmount(part);
          if (value !== 0) {
            amount = value;
            isExpense = isNegative;
          }
        }
        // Otherwise it's description
        else if (part.length > 2 && !description) {
          description = part.toUpperCase();
        }
      }
      
      if (description && amount !== 0) {
        const invoicePayment = isInvoicePayment(description);
        
        transactions.push({
          date: date || new Date().toISOString().split('T')[0],
          description,
          amount,
          type: isExpense ? 'EXPENSE' : 'INCOME',
          isInvoicePayment: invoicePayment,
          suggestedCardMatch: invoicePayment ? extractCardNameFromDescription(description) : undefined,
        });
      }
    }
  }
  
  return transactions;
}

function parseTextContent(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];
  
  // Multiple patterns for common bank statement formats
  const patterns = [
    // DD/MM/YYYY DESCRIPTION VALUE
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+(-?[\d.,]+)\s*$/,
    // DESCRIPTION DD/MM VALUE
    /(.+?)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})\s+(-?[\d.,]+)\s*$/,
    // DD/MM DESCRIPTION VALUE (short date)
    /(\d{1,2}[\/\-]\d{1,2})\s+(.+?)\s+(-?[\d.,]+)\s*$/,
    // Just description and value
    /^(.{5,}?)\s+(-?R?\$?\s?[\d.,]+)\s*$/,
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let date = '';
        let description = '';
        let amountStr = '';
        
        if (pattern === patterns[0] || pattern === patterns[2]) {
          [, date, description, amountStr] = match;
        } else if (pattern === patterns[1]) {
          [, description, date, amountStr] = match;
        } else {
          [, description, amountStr] = match;
        }
        
        const { value, isNegative } = parseAmount(amountStr);
        
        if (value !== 0 && description.length > 2) {
          const invoicePayment = isInvoicePayment(description);
          
          transactions.push({
            date: date ? parseDate(date) : new Date().toISOString().split('T')[0],
            description: description.toUpperCase().trim(),
            amount: value,
            type: isNegative ? 'EXPENSE' : 'INCOME',
            isInvoicePayment: invoicePayment,
            suggestedCardMatch: invoicePayment ? extractCardNameFromDescription(description) : undefined,
          });
          break;
        }
      }
    }
  }
  
  return transactions;
}

// Basic PDF text extraction (without AI)
// Note: This is a simplified parser that works with text-based PDFs
// For scanned PDFs or complex layouts, results may be limited
function parsePDFBasic(base64Content: string): ParseResult {
  console.log('Parsing PDF with basic text extraction...');
  
  try {
    // Decode base64 to binary
    const binaryStr = atob(base64Content);
    
    // Extract readable text from PDF (simplified approach)
    // This looks for text streams in the PDF structure
    const textChunks: string[] = [];
    let currentText = '';
    
    for (let i = 0; i < binaryStr.length; i++) {
      const char = binaryStr[i];
      // Only keep printable ASCII characters
      if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
        currentText += char;
      } else if (currentText.length > 0) {
        // Check if we have meaningful text
        if (currentText.length >= 5 && /[a-zA-Z0-9]/.test(currentText)) {
          textChunks.push(currentText);
        }
        currentText = '';
      }
    }
    
    if (currentText.length >= 5) {
      textChunks.push(currentText);
    }
    
    // Join chunks and try to parse as text
    const fullText = textChunks.join('\n');
    console.log('Extracted text length:', fullText.length);
    
    const transactions = parseTextContent(fullText);
    
    if (transactions.length === 0) {
      return {
        transactions: [],
        errors: ['Não foi possível extrair transações do PDF. Tente copiar o texto do extrato e colar na aba "Colar Texto".'],
      };
    }
    
    return { transactions };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      transactions: [],
      errors: ['Erro ao processar PDF. Tente converter para texto ou CSV.'],
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type, fileName } = await req.json();
    
    console.log(`Parsing bank statement: type=${type}, fileName=${fileName}`);
    
    let result: ParseResult;
    
    if (type === 'csv') {
      result = { transactions: parseCSVContent(content) };
    } else if (type === 'text') {
      result = { transactions: parseTextContent(content) };
    } else if (type === 'pdf') {
      result = parsePDFBasic(content);
    } else {
      throw new Error(`Unsupported file type: ${type}`);
    }
    
    console.log(`Parsed ${result.transactions.length} transactions`);
    
    // Log invoice payment detections
    const invoicePayments = result.transactions.filter(t => t.isInvoicePayment);
    if (invoicePayments.length > 0) {
      console.log(`Found ${invoicePayments.length} potential invoice payments`);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Parse error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
