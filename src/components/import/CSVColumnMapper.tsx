import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, ArrowRight, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type ColumnRole = 
  | 'date' 
  | 'description' 
  | 'amount' 
  | 'credit' 
  | 'debit' 
  | 'bank_reference' 
  | 'counterparty' 
  | 'ignore';

export interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  role: ColumnRole;
  sampleValues: string[];
}

interface CSVColumnMapperProps {
  headers: string[];
  previewRows: string[][];
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

const ROLE_OPTIONS: { value: ColumnRole; label: string; required: boolean }[] = [
  { value: 'date', label: 'Data', required: true },
  { value: 'description', label: 'Descrição', required: true },
  { value: 'amount', label: 'Valor (com sinal)', required: false },
  { value: 'credit', label: 'Entrada', required: false },
  { value: 'debit', label: 'Saída', required: false },
  { value: 'bank_reference', label: 'Código do Banco', required: false },
  { value: 'counterparty', label: 'Contraparte', required: false },
  { value: 'ignore', label: 'Ignorar', required: false },
];

function detectColumnRole(header: string, samples: string[]): ColumnRole {
  const headerLower = header.toLowerCase().trim();
  
  // Date detection
  if (/^(data|date|dt|dia|vencimento)/.test(headerLower)) return 'date';
  
  // Amount detection
  if (/^(valor|amount|value|total|montante)/.test(headerLower)) return 'amount';
  
  // Credit/Debit
  if (/^(cr[eé]dito|credit|entrada|receita|income)/.test(headerLower)) return 'credit';
  if (/^(d[eé]bito|debit|sa[ií]da|despesa|expense)/.test(headerLower)) return 'debit';
  
  // Description
  if (/^(descri[çc][ãa]o|description|desc|hist[oó]rico|lancamento|memo)/.test(headerLower)) return 'description';
  
  // Bank reference
  if (/^(id|c[oó]digo|code|refer[eê]ncia|ref|documento|doc|num|número)/.test(headerLower)) return 'bank_reference';
  
  // Counterparty
  if (/^(benefici[aá]rio|contraparte|counterparty|pagador|favorecido|destino|origem)/.test(headerLower)) return 'counterparty';
  
  // Try to infer from sample values
  const sampleAnalysis = samples.filter(Boolean).slice(0, 5);
  
  // Date patterns
  const datePattern = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](\d{2}|\d{4})$/;
  if (sampleAnalysis.every(s => datePattern.test(s.trim()))) return 'date';
  
  // Numeric patterns (could be amount)
  const numericPattern = /^-?[\d.,]+$/;
  if (sampleAnalysis.every(s => numericPattern.test(s.replace(/[R$€\s]/g, '').trim()))) {
    // Check if all positive - might be credit/debit separate columns
    const allPositive = sampleAnalysis.every(s => !s.includes('-'));
    if (allPositive && /entrada|cr/i.test(headerLower)) return 'credit';
    if (allPositive && /sa[ií]da|d[eé]b/i.test(headerLower)) return 'debit';
    return 'amount';
  }
  
  return 'ignore';
}

export function CSVColumnMapper({
  headers,
  previewRows,
  onMappingComplete,
  onCancel,
}: CSVColumnMapperProps) {
  const { t } = useTranslation();
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Initialize mappings with auto-detection
  useEffect(() => {
    const initialMappings: ColumnMapping[] = headers.map((header, index) => {
      const samples = previewRows.map(row => row[index] || '');
      return {
        columnIndex: index,
        columnName: header,
        role: detectColumnRole(header, samples),
        sampleValues: samples.slice(0, 3),
      };
    });
    setMappings(initialMappings);
  }, [headers, previewRows]);

  const updateMapping = (columnIndex: number, role: ColumnRole) => {
    setMappings(prev => prev.map(m => 
      m.columnIndex === columnIndex ? { ...m, role } : m
    ));
  };

  // Validation
  const validation = useMemo(() => {
    const hasDate = mappings.some(m => m.role === 'date');
    const hasDescription = mappings.some(m => m.role === 'description');
    const hasAmount = mappings.some(m => m.role === 'amount');
    const hasCreditDebit = mappings.some(m => m.role === 'credit') && mappings.some(m => m.role === 'debit');
    const hasValueColumn = hasAmount || hasCreditDebit;

    const errors: string[] = [];
    if (!hasDate) errors.push(t('import.mapping.missingDate', 'Selecione a coluna de Data'));
    if (!hasDescription) errors.push(t('import.mapping.missingDescription', 'Selecione a coluna de Descrição'));
    if (!hasValueColumn) errors.push(t('import.mapping.missingValue', 'Selecione a coluna de Valor (ou Entrada/Saída)'));

    return { isValid: errors.length === 0, errors };
  }, [mappings, t]);

  const handleConfirm = () => {
    if (validation.isValid) {
      onMappingComplete(mappings.filter(m => m.role !== 'ignore'));
    }
  };

  const getRoleBadgeColor = (role: ColumnRole) => {
    switch (role) {
      case 'date': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'description': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'amount': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'credit': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'debit': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'bank_reference': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
      case 'counterparty': return 'bg-cyan-500/20 text-cyan-700 border-cyan-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {t('import.mapping.instruction', 'Mapeie as colunas do seu arquivo para os campos correspondentes:')}
      </div>

      {/* Column Mapping Grid */}
      <div className="space-y-2">
        {mappings.map((mapping) => (
          <div 
            key={mapping.columnIndex}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{mapping.columnName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {mapping.sampleValues.filter(Boolean).slice(0, 2).join(' | ') || 'Sem dados'}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select
              value={mapping.role}
              onValueChange={(value: ColumnRole) => updateMapping(mapping.columnIndex, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-1.5", getRoleBadgeColor(option.value))}
                      >
                        {option.label}
                      </Badge>
                      {option.required && (
                        <span className="text-xs text-muted-foreground">*</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Preview */}
      <Collapsible open={showPreview} onOpenChange={setShowPreview}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            {t('import.mapping.preview', 'Prévia das primeiras linhas')}
            <ChevronDown className={cn("w-4 h-4 transition-transform", showPreview && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-[150px] rounded-lg border bg-muted/30">
            <div className="p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {headers.map((h, i) => (
                      <th key={i} className="text-left p-2 font-medium">
                        {h}
                        <Badge 
                          variant="outline" 
                          className={cn("ml-2 text-[10px] px-1", getRoleBadgeColor(mappings[i]?.role || 'ignore'))}
                        >
                          {ROLE_OPTIONS.find(r => r.value === mappings[i]?.role)?.label || 'Ignorar'}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className="border-b border-border/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-2 truncate max-w-[150px]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Validation Errors */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('common.cancel', 'Cancelar')}
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!validation.isValid}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          {t('import.mapping.confirm', 'Confirmar Mapeamento')}
        </Button>
      </div>
    </div>
  );
}
