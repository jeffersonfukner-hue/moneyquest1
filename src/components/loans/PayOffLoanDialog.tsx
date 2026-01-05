import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap, CheckCircle, Calculator } from 'lucide-react';
import { Loan } from '@/hooks/useLoans';

interface PayOffLoanDialogProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayOff: (loanId: string) => Promise<boolean>;
  onPrepay: (loanId: string, numberOfInstallments: number) => Promise<boolean>;
}

// Format currency with specific currency code
const formatLoanCurrency = (amount: number, currencyCode: string): string => {
  const localeMap: Record<string, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  return new Intl.NumberFormat(localeMap[currencyCode] || 'pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

export function PayOffLoanDialog({ 
  loan, 
  open, 
  onOpenChange, 
  onPayOff, 
  onPrepay 
}: PayOffLoanDialogProps) {
  const [mode, setMode] = useState<'prepay' | 'payoff'>('prepay');
  const [installmentsToPrepay, setInstallmentsToPrepay] = useState(1);
  const [loading, setLoading] = useState(false);

  const remainingInstallments = loan ? loan.quantidade_parcelas - loan.parcelas_pagas : 0;

  const prepayAmount = useMemo(() => {
    if (!loan) return 0;
    return installmentsToPrepay * loan.valor_parcela;
  }, [loan, installmentsToPrepay]);

  const handleSubmit = async () => {
    if (!loan) return;
    
    setLoading(true);
    
    let success = false;
    if (mode === 'payoff') {
      success = await onPayOff(loan.id);
    } else {
      success = await onPrepay(loan.id, installmentsToPrepay);
    }
    
    setLoading(false);
    
    if (success) {
      onOpenChange(false);
      // Reset state
      setMode('prepay');
      setInstallmentsToPrepay(1);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Antecipar ou Quitar
          </DialogTitle>
          <DialogDescription>
            {loan.instituicao_pessoa} - {remainingInstallments} parcela(s) restante(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'prepay' | 'payoff')}>
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="prepay" id="prepay" className="mt-1" />
              <Label htmlFor="prepay" className="cursor-pointer flex-1">
                <div className="font-medium">Antecipar Parcelas</div>
                <div className="text-sm text-muted-foreground">
                  Pague uma ou mais parcelas antecipadamente
                </div>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="payoff" id="payoff" className="mt-1" />
              <Label htmlFor="payoff" className="cursor-pointer flex-1">
                <div className="font-medium">Quitar Empréstimo</div>
                <div className="text-sm text-muted-foreground">
                  Pague todo o saldo devedor de uma vez
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Separator />

          {mode === 'prepay' ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="installments">Quantidade de parcelas a antecipar</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setInstallmentsToPrepay(Math.max(1, installmentsToPrepay - 1))}
                    disabled={installmentsToPrepay <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="installments"
                    type="number"
                    min={1}
                    max={remainingInstallments}
                    value={installmentsToPrepay}
                    onChange={(e) => setInstallmentsToPrepay(
                      Math.min(remainingInstallments, Math.max(1, parseInt(e.target.value) || 1))
                    )}
                    className="text-center w-20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setInstallmentsToPrepay(Math.min(remainingInstallments, installmentsToPrepay + 1))}
                    disabled={installmentsToPrepay >= remainingInstallments}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    de {remainingInstallments}
                  </span>
                </div>
              </div>

              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span>Valor a pagar:</span>
                    <span className="font-bold text-lg">
                      {formatLoanCurrency(prepayAmount, loan.currency)}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>

              {installmentsToPrepay === remainingInstallments && (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Isso irá quitar o empréstimo por completo!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Alert className="border-primary/30 bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Saldo devedor atual:</span>
                      <span className="font-bold text-lg">
                        {formatLoanCurrency(loan.saldo_devedor, loan.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ao quitar, todas as {remainingInstallments} parcelas restantes serão marcadas como pagas.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : mode === 'payoff' ? (
              'Quitar Empréstimo'
            ) : (
              `Antecipar ${installmentsToPrepay} Parcela(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}