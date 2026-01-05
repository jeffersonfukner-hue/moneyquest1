import { createClient } from "jsr:@supabase/supabase-js@2";

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
  rawText?: string;
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
  // Try to extract bank/card name from description
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

function parseCSVContent(content: string): ParsedTransaction[] {
  const lines = content.split('\n').filter(line => line.trim());
  const transactions: ParsedTransaction[] = [];
  
  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('data') || 
                     lines[0]?.toLowerCase().includes('date') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Try different CSV formats
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/"/g, ''));
    
    if (parts.length >= 2) {
      // Try to identify date, description, amount
      let date = '';
      let description = '';
      let amount = 0;
      
      for (const part of parts) {
        // Check if it's a date
        if (/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(part)) {
          date = part;
        }
        // Check if it's a number
        else if (/^-?[\d.,]+$/.test(part.replace(/[R$\s]/g, ''))) {
          const numStr = part.replace(/[R$\s]/g, '').replace(',', '.');
          const num = parseFloat(numStr);
          if (!isNaN(num) && num !== 0) {
            amount = Math.abs(num);
            if (numStr.startsWith('-') || part.includes('-')) {
              amount = -amount;
            }
          }
        }
        // Otherwise it's description
        else if (part.length > 2 && !description) {
          description = part.toUpperCase();
        }
      }
      
      if (description && amount !== 0) {
        const isExpense = amount < 0;
        const invoicePayment = isInvoicePayment(description);
        
        transactions.push({
          date: date || new Date().toISOString().split('T')[0],
          description,
          amount: Math.abs(amount),
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
  
  // Pattern for common bank statement formats
  const patterns = [
    // DD/MM/YYYY DESCRIPTION VALUE
    /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\s+(.+?)\s+(-?[\d.,]+)$/,
    // DESCRIPTION DD/MM VALUE
    /(.+?)\s+(\d{2}[\/\-]\d{2}[\/\-]?\d{0,4})\s+(-?[\d.,]+)$/,
    // Just description and value
    /^(.{10,}?)\s+(-?R?\$?\s?[\d.,]+)$/,
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let date = '';
        let description = '';
        let amountStr = '';
        
        if (pattern === patterns[0]) {
          [, date, description, amountStr] = match;
        } else if (pattern === patterns[1]) {
          [, description, date, amountStr] = match;
        } else {
          [, description, amountStr] = match;
          date = new Date().toISOString().split('T')[0];
        }
        
        const numStr = amountStr.replace(/[R$\s]/g, '').replace(',', '.');
        const amount = parseFloat(numStr);
        
        if (!isNaN(amount) && amount !== 0 && description.length > 2) {
          const isExpense = numStr.startsWith('-') || amountStr.includes('-');
          const invoicePayment = isInvoicePayment(description);
          
          transactions.push({
            date: date || new Date().toISOString().split('T')[0],
            description: description.toUpperCase().trim(),
            amount: Math.abs(amount),
            type: isExpense ? 'EXPENSE' : 'INCOME',
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

async function parsePDFWithAI(base64Content: string): Promise<ParseResult> {
  console.log('Parsing PDF with AI...');
  
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  
  const prompt = `Analyze this bank statement PDF and extract all transactions.
For each transaction, identify:
1. Date (in YYYY-MM-DD format)
2. Description
3. Amount (positive number)
4. Type: INCOME (deposits, credits) or EXPENSE (withdrawals, debits, payments)
5. Whether it appears to be a credit card invoice payment (look for terms like "PAGAMENTO FATURA", "FATURA CARTAO", etc.)

Return a JSON array with this structure:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "PAGAMENTO FATURA NUBANK",
      "amount": 1500.00,
      "type": "EXPENSE",
      "isInvoicePayment": true,
      "suggestedCardMatch": "Nubank"
    }
  ]
}

Only return valid JSON, no markdown or explanations.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Content,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API error:', error);
    throw new Error('Failed to parse PDF with AI');
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  console.log('AI response:', text.substring(0, 500));
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in response');
    return { transactions: [], errors: ['Could not parse PDF content'] };
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      transactions: parsed.transactions || [],
      rawText: text,
    };
  } catch (e) {
    console.error('JSON parse error:', e);
    return { transactions: [], errors: ['Invalid JSON response from AI'] };
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
      result = await parsePDFWithAI(content);
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
