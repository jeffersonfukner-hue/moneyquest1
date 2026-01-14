import React from 'react';

interface LanguageGuardProps {
  children: React.ReactNode;
}

/**
 * Guard simplificado - idioma fixo em pt-BR.
 * Não há mais detecção ou seleção de idioma.
 */
export const LanguageGuard: React.FC<LanguageGuardProps> = ({ children }) => {
  // Idioma sempre pt-BR, renderizar children diretamente
  return <>{children}</>;
};

export default LanguageGuard;
