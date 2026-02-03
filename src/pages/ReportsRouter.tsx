import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the professional reports page
const ProfessionalReportsPage = lazy(() => import('./ProfessionalReportsPage'));

/**
 * Reports Router - loads the professional reports page
 */
const ReportsRouter = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ProfessionalReportsPage />
    </Suspense>
  );
};

export default ReportsRouter;
