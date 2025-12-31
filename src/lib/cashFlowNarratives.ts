interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRate: number;
  topExpenseCategory?: string;
  topIncomeCategory?: string;
  comparisonChange?: number; // percentage vs previous period
  periodLabel: string;
}

interface NarrativeResult {
  title: string;
  message: string;
  impact: 'positive' | 'neutral' | 'negative' | 'critical';
}

const narrativeTemplates = {
  'pt-BR': {
    positive: {
      titles: [
        'Vitória Financeira!',
        'Tesouro em Crescimento!',
        'Sucesso na Jornada!',
        'Guilda Próspera!'
      ],
      messages: [
        'Um período próspero para a guilda! Seu tesouro cresceu {netFlow}. Taxa de economia: {savingsRate}%.',
        'Os cofres transbordam de ouro! Você economizou {savingsRate}% da renda neste período.',
        'Suas decisões financeiras brilham como espada encantada. Saldo positivo de {netFlow}!',
        'O dragão da dívida foi derrotado! Você acumulou {netFlow} em reservas.'
      ]
    },
    neutral: {
      titles: [
        'Equilíbrio Mantido',
        'Fortaleza Estável',
        'Caminho Seguro',
        'Base Sólida'
      ],
      messages: [
        'O equilíbrio foi mantido. Sua fortaleza permanece firme com fluxo de {netFlow}.',
        'Nem vitória nem derrota - você manteve a linha com resultado de {netFlow}.',
        'A guilda segue firme. Receitas e despesas se equilibram.',
        'Período de estabilidade. Sua base financeira está protegida.'
      ]
    },
    negative: {
      titles: [
        'Alerta da Guilda!',
        'Recursos Drenados',
        'Batalha Difícil',
        'Tempo de Reagrupar'
      ],
      messages: [
        'Batalhas intensas drenaram {netFlow} dos seus recursos. Hora de reagrupar!',
        'O tesouro sofreu baixas de {netFlow}. Revise sua estratégia, aventureiro.',
        'Despesas atacaram de todos os lados. Saldo negativo de {netFlow}.',
        'A masmorra financeira foi cruel este período. Perda de {netFlow}.'
      ]
    },
    critical: {
      titles: [
        'Situação Crítica!',
        'Tesouro em Perigo!',
        'Emergência Financeira!',
        'Alerta Vermelho!'
      ],
      messages: [
        'ALERTA CRÍTICO! Seu tesouro perdeu {netFlow}. Ação urgente necessária!',
        'O dragão das despesas causou estragos severos: -{netFlow}. Reforce as defesas!',
        'Situação de emergência! Perdas de {netFlow} exigem medidas drásticas.',
        'O castelo financeiro está sob cerco. Prejuízo de {netFlow} registrado.'
      ]
    },
    comparison: {
      improved: 'Comparado ao período anterior, você melhorou {change}%!',
      declined: 'Comparado ao período anterior, houve uma queda de {change}%.',
      stable: 'Performance similar ao período anterior.'
    },
    topCategory: {
      expense: 'O {category} foi o maior consumidor de recursos.',
      income: 'A maior fonte de renda foi {category}.'
    }
  },
  'en-US': {
    positive: {
      titles: [
        'Financial Victory!',
        'Growing Treasury!',
        'Quest Success!',
        'Prosperous Guild!'
      ],
      messages: [
        'A prosperous period for the guild! Your treasury grew by {netFlow}. Savings rate: {savingsRate}%.',
        'The coffers overflow with gold! You saved {savingsRate}% of income this period.',
        'Your financial decisions shine like an enchanted sword. Positive balance of {netFlow}!',
        'The debt dragon was defeated! You accumulated {netFlow} in reserves.'
      ]
    },
    neutral: {
      titles: [
        'Balance Maintained',
        'Stable Fortress',
        'Safe Path',
        'Solid Foundation'
      ],
      messages: [
        'Balance was maintained. Your fortress stands firm with a flow of {netFlow}.',
        'Neither victory nor defeat - you held the line with a result of {netFlow}.',
        'The guild stays strong. Income and expenses are balanced.',
        'Period of stability. Your financial foundation is protected.'
      ]
    },
    negative: {
      titles: [
        'Guild Alert!',
        'Resources Drained',
        'Tough Battle',
        'Time to Regroup'
      ],
      messages: [
        'Intense battles drained {netFlow} from your resources. Time to regroup!',
        'The treasury took losses of {netFlow}. Review your strategy, adventurer.',
        'Expenses attacked from all sides. Negative balance of {netFlow}.',
        'The financial dungeon was cruel this period. Loss of {netFlow}.'
      ]
    },
    critical: {
      titles: [
        'Critical Situation!',
        'Treasury in Danger!',
        'Financial Emergency!',
        'Red Alert!'
      ],
      messages: [
        'CRITICAL ALERT! Your treasury lost {netFlow}. Urgent action needed!',
        'The expense dragon caused severe damage: -{netFlow}. Reinforce defenses!',
        'Emergency situation! Losses of {netFlow} require drastic measures.',
        'The financial castle is under siege. Loss of {netFlow} recorded.'
      ]
    },
    comparison: {
      improved: 'Compared to the previous period, you improved by {change}%!',
      declined: 'Compared to the previous period, there was a decline of {change}%.',
      stable: 'Similar performance to the previous period.'
    },
    topCategory: {
      expense: 'The {category} was the biggest resource consumer.',
      income: 'The main income source was {category}.'
    }
  },
  'es-ES': {
    positive: {
      titles: [
        '¡Victoria Financiera!',
        '¡Tesoro en Crecimiento!',
        '¡Éxito en la Misión!',
        '¡Gremio Próspero!'
      ],
      messages: [
        '¡Un período próspero para el gremio! Tu tesoro creció {netFlow}. Tasa de ahorro: {savingsRate}%.',
        '¡Las arcas rebosan de oro! Ahorraste {savingsRate}% de los ingresos este período.',
        'Tus decisiones financieras brillan como espada encantada. ¡Saldo positivo de {netFlow}!',
        '¡El dragón de la deuda fue derrotado! Acumulaste {netFlow} en reservas.'
      ]
    },
    neutral: {
      titles: [
        'Equilibrio Mantenido',
        'Fortaleza Estable',
        'Camino Seguro',
        'Base Sólida'
      ],
      messages: [
        'El equilibrio se mantuvo. Tu fortaleza permanece firme con flujo de {netFlow}.',
        'Ni victoria ni derrota - mantuviste la línea con resultado de {netFlow}.',
        'El gremio sigue firme. Ingresos y gastos están equilibrados.',
        'Período de estabilidad. Tu base financiera está protegida.'
      ]
    },
    negative: {
      titles: [
        '¡Alerta del Gremio!',
        'Recursos Drenados',
        'Batalla Difícil',
        'Hora de Reagrupar'
      ],
      messages: [
        'Batallas intensas drenaron {netFlow} de tus recursos. ¡Hora de reagrupar!',
        'El tesoro sufrió pérdidas de {netFlow}. Revisa tu estrategia, aventurero.',
        'Los gastos atacaron por todos lados. Saldo negativo de {netFlow}.',
        'La mazmorra financiera fue cruel este período. Pérdida de {netFlow}.'
      ]
    },
    critical: {
      titles: [
        '¡Situación Crítica!',
        '¡Tesoro en Peligro!',
        '¡Emergencia Financiera!',
        '¡Alerta Roja!'
      ],
      messages: [
        '¡ALERTA CRÍTICO! Tu tesoro perdió {netFlow}. ¡Acción urgente necesaria!',
        'El dragón de gastos causó daños severos: -{netFlow}. ¡Refuerza las defensas!',
        '¡Situación de emergencia! Pérdidas de {netFlow} requieren medidas drásticas.',
        'El castillo financiero está bajo asedio. Pérdida de {netFlow} registrada.'
      ]
    },
    comparison: {
      improved: '¡Comparado con el período anterior, mejoraste {change}%!',
      declined: 'Comparado con el período anterior, hubo una caída de {change}%.',
      stable: 'Rendimiento similar al período anterior.'
    },
    topCategory: {
      expense: 'El {category} fue el mayor consumidor de recursos.',
      income: 'La principal fuente de ingresos fue {category}.'
    }
  }
};

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const formatValue = (value: number, currency: string): string => {
  const formatter = new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : currency === 'EUR' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(Math.abs(value));
};

export const generateCashFlowNarrative = (
  summary: CashFlowSummary,
  language: string = 'pt-BR',
  currency: string = 'BRL'
): NarrativeResult => {
  const lang = (language in narrativeTemplates ? language : 'en-US') as keyof typeof narrativeTemplates;
  const templates = narrativeTemplates[lang];
  
  // Determine impact level based on savings rate and net flow
  let impact: NarrativeResult['impact'];
  if (summary.savingsRate >= 20) {
    impact = 'positive';
  } else if (summary.savingsRate >= 0) {
    impact = 'neutral';
  } else if (summary.savingsRate >= -20) {
    impact = 'negative';
  } else {
    impact = 'critical';
  }

  const templateSet = templates[impact];
  const title = getRandomItem(templateSet.titles);
  let message = getRandomItem(templateSet.messages);

  // Replace placeholders
  message = message
    .replace('{netFlow}', formatValue(summary.netFlow, currency))
    .replace('{savingsRate}', Math.abs(summary.savingsRate).toFixed(1));

  // Add comparison if available
  if (summary.comparisonChange !== undefined && Math.abs(summary.comparisonChange) > 1) {
    const comparisonTemplate = summary.comparisonChange > 0 
      ? templates.comparison.improved 
      : templates.comparison.declined;
    const comparisonMessage = comparisonTemplate.replace('{change}', Math.abs(summary.comparisonChange).toFixed(1));
    message += ' ' + comparisonMessage;
  }

  // Add top category info
  if (summary.topExpenseCategory) {
    const categoryMessage = templates.topCategory.expense.replace('{category}', summary.topExpenseCategory);
    message += ' ' + categoryMessage;
  }

  return { title, message, impact };
};

export const getImpactColor = (impact: NarrativeResult['impact']): string => {
  switch (impact) {
    case 'positive': return 'text-green-500';
    case 'neutral': return 'text-blue-500';
    case 'negative': return 'text-amber-500';
    case 'critical': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
};

export const getImpactBgColor = (impact: NarrativeResult['impact']): string => {
  switch (impact) {
    case 'positive': return 'bg-green-500/10 border-green-500/20';
    case 'neutral': return 'bg-blue-500/10 border-blue-500/20';
    case 'negative': return 'bg-amber-500/10 border-amber-500/20';
    case 'critical': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-muted border-border';
  }
};

export const getImpactIcon = (impact: NarrativeResult['impact']): string => {
  switch (impact) {
    case 'positive': return '🏆';
    case 'neutral': return '⚖️';
    case 'negative': return '⚠️';
    case 'critical': return '🔥';
    default: return '📊';
  }
};
