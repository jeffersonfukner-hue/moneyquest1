import { ColumnMapping, ColumnRole } from '@/components/import/CSVColumnMapper';
import { formatDateForDB } from '@/lib/dateUtils';

export interface ParsedBankLine {
  date: string; // ISO format YYYY-MM-DD
  description: string;
  amount: number; // Positive for income, negative for expense
  bankReference?: string;
  counterparty?: string;
  fingerprint: string;
  rawRow: string[];
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  detectedSeparator: string;
  encoding: string;
}

/**
 * Detect CSV separator (comma, semicolon, tab)
 */
function detectSeparator(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  
  const separators = [';', ',', '\t'];
  let bestSeparator = ',';
  let maxCount = 0;

  for (const sep of separators) {
    const count = (firstLines.match(new RegExp(`\\${sep}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestSeparator = sep;
    }
  }

  return bestSeparator;
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse CSV content into headers and rows
 */
export function parseCSVContent(content: string): CSVParseResult {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const separator = detectSeparator(normalized);
  
  const lines = normalized.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], detectedSeparator: separator, encoding: 'UTF-8' };
  }

  // First line as headers
  const headers = parseCSVLine(lines[0], separator);
  
  // Remaining lines as data
  const rows = lines.slice(1).map(line => parseCSVLine(line, separator));

  return { headers, rows, detectedSeparator: separator, encoding: 'UTF-8' };
}

/**
 * Parse date string in common formats to ISO
 */
function parseDate(dateStr: string): string {
  const cleaned = dateStr.trim();
  
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to today
  return formatDateForDB(new Date());
}

/**
 * Parse amount string in various formats
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // Remove currency symbols and spaces
  let cleaned = amountStr.replace(/[R$€$£\s]/g, '').trim();
  
  // Check for negative indicators
  const isNegative = cleaned.startsWith('-') || 
                     cleaned.includes('D') || 
                     cleaned.toLowerCase().includes('deb') ||
                     cleaned.startsWith('(') && cleaned.endsWith(')');
  
  cleaned = cleaned.replace(/[-+()CD]/gi, '').trim();
  
  // Handle Brazilian format (1.234,56) vs US format (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Brazilian: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Could be decimal comma (1234,56) or thousand separator (1,234)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : (isNegative ? -Math.abs(value) : value);
}

/**
 * Normalize text: trim, remove duplicate spaces, uppercase
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/**
 * Generate fingerprint for deduplication
 */
function generateFingerprint(date: string, amount: number, description: string): string {
  const normalizedDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30);
  
  return `${date}|${amount.toFixed(2)}|${normalizedDesc}`;
}

/**
 * Transform parsed CSV rows using column mappings
 */
export function transformWithMappings(
  rows: string[][],
  mappings: ColumnMapping[]
): ParsedBankLine[] {
  const dateMapping = mappings.find(m => m.role === 'date');
  const descMapping = mappings.find(m => m.role === 'description');
  const amountMapping = mappings.find(m => m.role === 'amount');
  const creditMapping = mappings.find(m => m.role === 'credit');
  const debitMapping = mappings.find(m => m.role === 'debit');
  const refMapping = mappings.find(m => m.role === 'bank_reference');
  const counterpartyMapping = mappings.find(m => m.role === 'counterparty');

  if (!dateMapping || !descMapping) {
    throw new Error('Date and Description columns are required');
  }

  if (!amountMapping && !(creditMapping && debitMapping)) {
    throw new Error('Amount column or Credit/Debit columns are required');
  }

  const results: ParsedBankLine[] = [];

  for (const row of rows) {
    // Skip empty rows
    if (row.every(cell => !cell.trim())) continue;

    const dateStr = row[dateMapping.columnIndex] || '';
    const descStr = row[descMapping.columnIndex] || '';
    
    let amount = 0;
    
    if (amountMapping) {
      amount = parseAmount(row[amountMapping.columnIndex] || '');
    } else if (creditMapping && debitMapping) {
      const credit = parseAmount(row[creditMapping.columnIndex] || '');
      const debit = parseAmount(row[debitMapping.columnIndex] || '');
      amount = credit - Math.abs(debit);
    }

    // Skip if no valid amount or description
    if (amount === 0 || !descStr.trim()) continue;

    const date = parseDate(dateStr);
    const description = normalizeText(descStr);
    const bankReference = refMapping ? row[refMapping.columnIndex]?.trim() : undefined;
    const counterparty = counterpartyMapping ? normalizeText(row[counterpartyMapping.columnIndex] || '') : undefined;

    results.push({
      date,
      description,
      amount,
      bankReference: bankReference || undefined,
      counterparty: counterparty || undefined,
      fingerprint: generateFingerprint(date, amount, description),
      rawRow: row,
    });
  }

  return results;
}

/**
 * Deduplicate parsed lines against existing fingerprints
 */
export function deduplicateLines(
  newLines: ParsedBankLine[],
  existingFingerprints: Set<string>
): { unique: ParsedBankLine[]; duplicates: number } {
  const unique: ParsedBankLine[] = [];
  let duplicates = 0;

  for (const line of newLines) {
    if (existingFingerprints.has(line.fingerprint)) {
      duplicates++;
    } else {
      unique.push(line);
    }
  }

  return { unique, duplicates };
}
