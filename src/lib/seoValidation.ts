/**
 * SEO Validation Utilities for Blog Articles
 * Provides automatic validation and alerts for SEO best practices
 */

export const SEO_LIMITS = {
  metaTitle: { min: 30, ideal: 50, max: 60 },
  metaDescription: { min: 120, ideal: 150, max: 160 }
} as const;

export interface SEOValidation {
  slug: string;
  field: 'metaTitle' | 'metaDescription';
  length: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
  limits: { min: number; ideal: number; max: number };
}

export interface ArticleWithSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

export const validateArticleSEO = (article: ArticleWithSEO): SEOValidation[] => {
  const validations: SEOValidation[] = [];
  
  // Validate metaTitle
  const titleLen = article.metaTitle.length;
  const titleLimits = SEO_LIMITS.metaTitle;
  
  if (titleLen < titleLimits.min) {
    validations.push({
      slug: article.slug,
      field: 'metaTitle',
      length: titleLen,
      status: 'error',
      message: `Title muito curto (${titleLen}/${titleLimits.min} min)`,
      limits: titleLimits
    });
  } else if (titleLen > titleLimits.max) {
    validations.push({
      slug: article.slug,
      field: 'metaTitle',
      length: titleLen,
      status: 'error',
      message: `Title muito longo (${titleLen}/${titleLimits.max} max) - pode ser truncado`,
      limits: titleLimits
    });
  } else if (titleLen < titleLimits.ideal) {
    validations.push({
      slug: article.slug,
      field: 'metaTitle',
      length: titleLen,
      status: 'warning',
      message: `Title curto (${titleLen}/${titleLimits.ideal} ideal)`,
      limits: titleLimits
    });
  } else {
    validations.push({
      slug: article.slug,
      field: 'metaTitle',
      length: titleLen,
      status: 'ok',
      message: `Title OK (${titleLen} caracteres)`,
      limits: titleLimits
    });
  }
  
  // Validate metaDescription
  const descLen = article.metaDescription.length;
  const descLimits = SEO_LIMITS.metaDescription;
  
  if (descLen < descLimits.min) {
    validations.push({
      slug: article.slug,
      field: 'metaDescription',
      length: descLen,
      status: 'error',
      message: `Description muito curta (${descLen}/${descLimits.min} min)`,
      limits: descLimits
    });
  } else if (descLen > descLimits.max) {
    validations.push({
      slug: article.slug,
      field: 'metaDescription',
      length: descLen,
      status: 'warning',
      message: `Description longa (${descLen}/${descLimits.max} max) - pode ser truncada`,
      limits: descLimits
    });
  } else if (descLen < descLimits.ideal) {
    validations.push({
      slug: article.slug,
      field: 'metaDescription',
      length: descLen,
      status: 'warning',
      message: `Description curta (${descLen}/${descLimits.ideal} ideal)`,
      limits: descLimits
    });
  } else {
    validations.push({
      slug: article.slug,
      field: 'metaDescription',
      length: descLen,
      status: 'ok',
      message: `Description OK (${descLen} caracteres)`,
      limits: descLimits
    });
  }
  
  return validations;
};

export const validateAllArticlesSEO = (articles: ArticleWithSEO[]): SEOValidation[] => {
  return articles.flatMap(validateArticleSEO);
};

export const getSEOIssues = (validations: SEOValidation[]): SEOValidation[] => {
  return validations.filter(v => v.status !== 'ok');
};

export const logSEOValidationResults = (articles: ArticleWithSEO[]): void => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;
  
  const allValidations = validateAllArticlesSEO(articles);
  const issues = getSEOIssues(allValidations);
  
  if (issues.length === 0) {
    console.log('%c✅ SEO Check: All articles pass validation', 'color: green; font-weight: bold');
    return;
  }
  
  console.group('%c⚠️ SEO Issues Found in Blog Articles', 'color: orange; font-weight: bold');
  
  const errors = issues.filter(i => i.status === 'error');
  const warnings = issues.filter(i => i.status === 'warning');
  
  if (errors.length > 0) {
    console.group(`🔴 Errors (${errors.length})`);
    errors.forEach(issue => {
      console.error(`[${issue.slug}] ${issue.field}: ${issue.message}`);
    });
    console.groupEnd();
  }
  
  if (warnings.length > 0) {
    console.group(`🟡 Warnings (${warnings.length})`);
    warnings.forEach(issue => {
      console.warn(`[${issue.slug}] ${issue.field}: ${issue.message}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
};

export const getStatusColor = (status: SEOValidation['status']): string => {
  switch (status) {
    case 'ok': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'error': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
};

export const getStatusBadgeVariant = (status: SEOValidation['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'ok': return 'default';
    case 'warning': return 'secondary';
    case 'error': return 'destructive';
    default: return 'outline';
  }
};
