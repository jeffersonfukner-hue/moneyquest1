import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Upload, FileText, Loader2, AlertCircle, CheckCircle2, 
  ArrowLeft, ArrowRight, FileSpreadsheet
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CSVColumnMapper, ColumnMapping } from './CSVColumnMapper';
import { parseCSVContent, transformWithMappings, deduplicateLines, ParsedBankLine } from '@/lib/csvParser';

type WizardStep = 'upload' | 'mapping' | 'review' | 'complete';

interface CSVImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletName: string;
  existingFingerprints: Set<string>;
  onImport: (lines: ParsedBankLine[]) => Promise<boolean>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function CSVImportWizard({
  open,
  onOpenChange,
  walletName,
  existingFingerprints,
  onImport,
}: CSVImportWizardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<WizardStep>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CSV data
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  
  // Mapped data
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [parsedLines, setParsedLines] = useState<ParsedBankLine[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  
  // Import result
  const [importedCount, setImportedCount] = useState(0);

  const resetWizard = useCallback(() => {
    setStep('upload');
    setLoading(false);
    setError(null);
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMappings([]);
    setParsedLines([]);
    setDuplicateCount(0);
    setImportedCount(0);
  }, []);

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(t('import.errors.fileTooLarge', 'Arquivo muito grande. Máximo: 5MB'));
      }

      // Validate file type
      const isCSV = file.name.toLowerCase().endsWith('.csv') || 
                    file.name.toLowerCase().endsWith('.txt');
      if (!isCSV) {
        throw new Error(t('import.errors.invalidFormat', 'Formato inválido. Use arquivo CSV ou TXT.'));
      }

      // Read file content
      const content = await file.text();
      
      // Check if content is valid
      if (!content.trim()) {
        throw new Error(t('import.errors.emptyFile', 'Arquivo vazio'));
      }

      // Parse CSV
      const { headers: parsedHeaders, rows: parsedRows } = parseCSVContent(content);
      
      if (parsedHeaders.length === 0) {
        throw new Error(t('import.errors.noHeaders', 'Nenhum cabeçalho encontrado'));
      }

      if (parsedRows.length === 0) {
        throw new Error(t('import.errors.noData', 'Nenhum dado encontrado no arquivo'));
      }

      setFileName(file.name);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setStep('mapping');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler arquivo');
    } finally {
      setLoading(false);
      // Reset input to allow re-selecting same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMappingComplete = (completedMappings: ColumnMapping[]) => {
    setMappings(completedMappings);
    setError(null);

    try {
      // Transform rows using mappings
      const transformed = transformWithMappings(rows, completedMappings);
      
      if (transformed.length === 0) {
        throw new Error(t('import.errors.noValidRows', 'Nenhuma linha válida após o processamento'));
      }

      // Deduplicate
      const { unique, duplicates } = deduplicateLines(transformed, existingFingerprints);
      
      setParsedLines(unique);
      setDuplicateCount(duplicates);
      setStep('review');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar dados');
    }
  };

  const handleImport = async () => {
    if (parsedLines.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const success = await onImport(parsedLines);
      
      if (success) {
        setImportedCount(parsedLines.length);
        setStep('complete');
      } else {
        throw new Error(t('import.errors.importFailed', 'Falha ao importar. Tente novamente.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    switch (step) {
      case 'upload': return 25;
      case 'mapping': return 50;
      case 'review': return 75;
      case 'complete': return 100;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {t('import.wizardTitle', 'Importar Extrato CSV')}
          </DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{walletName}</span>
            <span>
              {step === 'upload' && t('import.steps.upload', 'Upload')}
              {step === 'mapping' && t('import.steps.mapping', 'Mapeamento')}
              {step === 'review' && t('import.steps.review', 'Revisão')}
              {step === 'complete' && t('import.steps.complete', 'Concluído')}
            </span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  loading && "opacity-50 pointer-events-none"
                )}
              >
                {loading ? (
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="text-lg font-medium">
                  {loading 
                    ? t('import.processing', 'Processando...')
                    : t('import.dropHere', 'Clique ou arraste o arquivo aqui')
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('import.csvFormats', 'Formatos suportados: CSV, TXT (até 5MB)')}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">{t('import.tips.title', 'Dicas:')}</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t('import.tips.encoding', 'Use arquivos em UTF-8 para evitar problemas de codificação')}</li>
                  <li>{t('import.tips.header', 'A primeira linha deve conter os nomes das colunas')}</li>
                  <li>{t('import.tips.formats', 'Datas em DD/MM/AAAA ou AAAA-MM-DD são reconhecidas automaticamente')}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4" />
                <span className="font-medium">{fileName}</span>
                <Badge variant="secondary">{rows.length} linhas</Badge>
              </div>
              
              <CSVColumnMapper
                headers={headers}
                previewRows={rows.slice(0, 10)}
                onMappingComplete={handleMappingComplete}
                onCancel={() => setStep('upload')}
              />
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">{t('import.review.newLines', 'Novos lançamentos')}</p>
                  <p className="text-2xl font-bold text-green-600">{parsedLines.length}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground">{t('import.review.duplicates', 'Duplicatas ignoradas')}</p>
                  <p className="text-2xl font-bold text-amber-600">{duplicateCount}</p>
                </div>
              </div>

              {parsedLines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                    {t('import.review.preview', 'Prévia dos lançamentos')}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-right p-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLines.slice(0, 15).map((line, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="p-2">{line.date}</td>
                            <td className="p-2 truncate max-w-[200px]">{line.description}</td>
                            <td className={cn(
                              "p-2 text-right tabular-nums",
                              line.amount > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {line.amount > 0 ? '+' : ''}{line.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedLines.length > 15 && (
                      <p className="p-2 text-center text-sm text-muted-foreground border-t">
                        ... e mais {parsedLines.length - 15} lançamentos
                      </p>
                    )}
                  </div>
                </div>
              )}

              {parsedLines.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('import.review.noNew', 'Nenhum lançamento novo')}</AlertTitle>
                  <AlertDescription>
                    {t('import.review.allDuplicates', 'Todos os lançamentos já foram importados anteriormente.')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep('mapping')} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back', 'Voltar')}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={loading || parsedLines.length === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {t('import.review.import', 'Importar {{count}} lançamentos', { count: parsedLines.length })}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-bold">
                  {t('import.complete.title', 'Importação Concluída!')}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {t('import.complete.message', '{{count}} lançamentos importados para conciliação.', { count: importedCount })}
                </p>
              </div>
              <Button onClick={handleClose}>
                {t('import.complete.goToReconciliation', 'Ir para Conciliação')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
