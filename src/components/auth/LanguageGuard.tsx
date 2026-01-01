import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LANGUAGE_PREFERENCE_KEY } from '@/i18n';
import { detectLanguageFromTimezone } from '@/lib/countryDetection';

interface LanguageGuardProps {
  children: React.ReactNode;
}

/**
 * Guard que verifica se o idioma está definido.
 * Se não estiver, tenta detectar automaticamente pelo timezone.
 * Se a detecção falhar, redireciona para a tela de seleção.
 */
export const LanguageGuard: React.FC<LanguageGuardProps> = ({ children }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [needsSelection, setNeedsSelection] = useState(false);

  useEffect(() => {
    const checkLanguage = () => {
      // Verificar se já existe preferência explícita
      const hasExplicitPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === 'true';
      const savedLang = localStorage.getItem('i18nextLng');

      if (hasExplicitPreference && savedLang) {
        // Usuário já tem preferência salva
        setNeedsSelection(false);
        setIsChecking(false);
        return;
      }

      // Tentar detectar idioma pelo timezone
      const detectedLanguage = detectLanguageFromTimezone();

      if (detectedLanguage) {
        // Detecção automática bem sucedida
        localStorage.setItem('i18nextLng', detectedLanguage);
        localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
        setNeedsSelection(false);
      } else {
        // Detecção falhou - precisa de seleção manual
        setNeedsSelection(true);
      }

      setIsChecking(false);
    };

    checkLanguage();
  }, []);

  // Mostrar loading enquanto verifica
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20" />
        </div>
      </div>
    );
  }

  // Redirecionar para seleção de idioma se necessário
  if (needsSelection) {
    return <Navigate to="/select-language" state={{ from: location }} replace />;
  }

  // Idioma definido, renderizar children
  return <>{children}</>;
};

export default LanguageGuard;
