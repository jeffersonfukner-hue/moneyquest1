/**
 * Static Narrative Templates for AI-free version
 * These replace the dynamic AI-generated narratives
 */

import { CATEGORY_TO_RPG, calculateImpact as calcImpact, moodToBalanceStatus } from './narrativeConfig';

type Impact = 'low' | 'medium' | 'high' | 'critical';
type EventType = 'INCOME' | 'EXPENSE';

interface NarrativeResult {
  narrative: string;
  impact: Impact;
}

// Random selector helper
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ========== EXPENSE NARRATIVES ==========

const EXPENSE_NARRATIVES: Record<Impact, Record<string, string[]>> = {
  low: {
    food: [
      'Uma refeição tranquila recarrega suas energias para a jornada. Pequenos gastos, grandes aventuras!',
      'Combustível para o herói! Este lanche mantém você focado na missão.',
      'Uma pausa merecida para se alimentar. Seu tesouro está seguro!',
    ],
    transport: [
      'Transporte seguro até seu destino. A jornada continua!',
      'Mobilidade é poder! Um pequeno investimento em locomoção.',
      'Cada viagem te aproxima dos seus objetivos. Bom trajeto!',
    ],
    housing: [
      'Manutenção da fortaleza em dia. Pequeno gasto, grande proteção!',
      'Contas básicas quitadas. Sua base de operações está segura.',
      'Investimento na sua moradia. Lar doce lar protegido!',
    ],
    fun: [
      'Um momento de lazer bem merecido! Equilíbrio é a chave do sucesso.',
      'Diversão controlada. Você sabe aproveitar sem exagerar!',
      'Entretenimento na medida certa. Continue assim, herói!',
    ],
    impulse: [
      'Compra pequena registrada. Fique atento aos impulsos!',
      'Um gasto pontual. Lembre-se de manter o foco no objetivo.',
      'Aquisição modesta. Seu tesouro continua bem guardado.',
    ],
    emergency: [
      'Saúde em primeiro lugar! Investimento no seu bem-estar.',
      'Cuidar de si é prioridade. Gasto necessário aprovado.',
      'Manutenção da saúde em dia. Herói saudável, missão cumprida!',
    ],
    investment: [
      'Investindo em conhecimento. Cada centavo vale a pena!',
      'Educação é poder! Este gasto retornará em dobro.',
      'Aprimorando suas habilidades. Excelente escolha!',
    ],
  },
  medium: {
    food: [
      'Uma refeição mais elaborada. Lembre-se de equilibrar nos próximos dias.',
      'Gasto moderado em alimentação. Fique de olho no orçamento semanal.',
      'Alimentação de qualidade! Mas atenção ao balanço do mês.',
    ],
    transport: [
      'Investimento considerável em mobilidade. Planeje os próximos deslocamentos.',
      'Gasto de transporte acima da média. Vale revisar as rotas.',
      'Viagem registrada. Considere alternativas mais econômicas quando possível.',
    ],
    housing: [
      'Conta de moradia significativa. Faz parte da segurança do lar.',
      'Manutenção importante da fortaleza. Planeje para os próximos meses.',
      'Investimento relevante na sua base. Essencial, mas fique atento.',
    ],
    fun: [
      'Momento de diversão mais intenso! Equilibre nas próximas semanas.',
      'Lazer com moderação é importante, mas atenção ao saldo.',
      'Entretenimento registrado. Hora de focar na próxima missão!',
    ],
    impulse: [
      'Compra por impulso detectada! Reflita antes da próxima aquisição.',
      'Gasto não planejado. Considere adicionar ao orçamento futuro.',
      'Aquisição moderada. Tente resistir aos próximos impulsos.',
    ],
    emergency: [
      'Investimento significativo em saúde. Prioridade correta!',
      'Gasto médico necessário. Sua saúde vale cada centavo.',
      'Cuidando de você. Não economize quando se trata de bem-estar.',
    ],
    investment: [
      'Bom investimento em educação! O retorno virá em breve.',
      'Conhecimento é seu maior tesouro. Gasto aprovado!',
      'Desenvolvendo habilidades. Este investimento não tem preço.',
    ],
  },
  high: {
    food: [
      'Alerta! Gasto alto em alimentação. Revise suas opções de refeição.',
      'Investimento pesado em comida. Considere cozinhar mais em casa.',
      'Atenção, herói! Alimentação consumindo muito do tesouro.',
    ],
    transport: [
      'Gasto elevado em transporte! Hora de repensar a mobilidade.',
      'Alerta de mobilidade! Considere opções mais econômicas.',
      'Transporte pesando no bolso. Planeje melhor os deslocamentos.',
    ],
    housing: [
      'Moradia exigindo bastante do orçamento. Revise os contratos.',
      'Conta de habitação alta. Considere renegociar valores.',
      'Fortaleza custando caro! Avalie alternativas se possível.',
    ],
    fun: [
      'Cuidado! Diversão ultrapassando os limites seguros do orçamento.',
      'Lazer intenso demais! Equilibre com economia nos próximos dias.',
      'Alerta de entretenimento! O tesouro precisa de proteção.',
    ],
    impulse: [
      'Perigo! Compra impulsiva de alto valor detectada.',
      'Impulso perigoso! Respire fundo antes da próxima compra.',
      'Gasto não planejado significativo. Hora de reavaliar prioridades.',
    ],
    emergency: [
      'Gasto de saúde elevado, mas necessário. Cuide-se!',
      'Investimento pesado em bem-estar. Sua saúde agradece.',
      'Saúde não tem preço, mas planeje a recuperação do orçamento.',
    ],
    investment: [
      'Grande investimento em educação! Colha os frutos em breve.',
      'Aposta alta em conhecimento. Que esse investimento retorne!',
      'Educação de peso! Prepare-se para crescer.',
    ],
  },
  critical: {
    food: [
      'ALERTA CRÍTICO! Gasto em alimentação fora de controle. Ação imediata necessária!',
      'Emergência no orçamento alimentar! Revise urgentemente seus hábitos.',
      'Tesouro em perigo! Alimentação consumindo recursos demais.',
    ],
    transport: [
      'EMERGÊNCIA! Transporte drenando seu tesouro. Reavalie imediatamente!',
      'Situação crítica de mobilidade! Considere mudanças urgentes.',
      'Alerta máximo! Custos de transporte insustentáveis.',
    ],
    housing: [
      'ATENÇÃO TOTAL! Moradia comprometendo seriamente o orçamento.',
      'Situação habitacional crítica! Busque alternativas urgentes.',
      'Fortaleza em risco! Custos de moradia muito elevados.',
    ],
    fun: [
      'PERIGO EXTREMO! Diversão destruindo suas finanças. Pare agora!',
      'Emergência financeira! Lazer fora de controle total.',
      'Alerta vermelho! Entretenimento consumindo todo o tesouro.',
    ],
    impulse: [
      'ALERTA MÁXIMO! Compra impulsiva devastadora. Reflita profundamente!',
      'Emergência! Impulso de compra perigoso detectado.',
      'Situação crítica! Este gasto compromete seus objetivos.',
    ],
    emergency: [
      'Gasto de saúde crítico, mas sua vida vale mais. Força, herói!',
      'Situação de emergência. Priorize sua recuperação.',
      'Saúde em primeiro lugar, sempre. Vamos reconstruir juntos.',
    ],
    investment: [
      'Investimento massivo em educação! Que seja transformador.',
      'Aposta máxima em conhecimento. O retorno precisa vir!',
      'Grande decisão educacional. Faça valer cada centavo!',
    ],
  },
};

// ========== INCOME NARRATIVES ==========

const INCOME_NARRATIVES: Record<Impact, string[]> = {
  low: [
    'Pequena entrada no tesouro! Cada moeda conta na jornada.',
    'Recurso adicional conquistado! Continue assim, herói.',
    'Ganho registrado. Pequenos passos, grandes conquistas!',
    'Moedas entrando no cofre! Sua dedicação está valendo.',
  ],
  medium: [
    'Boa entrada de recursos! Seu tesouro está crescendo.',
    'Ganho significativo registrado! A jornada está valendo a pena.',
    'Recompensa merecida! Continue focado nos objetivos.',
    'Cofre engordando! Sua estratégia está funcionando.',
  ],
  high: [
    'Excelente entrada de recursos! Seu tesouro prospera!',
    'Grande recompensa conquistada! Você está dominando a missão.',
    'Ganho impressionante! A fortuna sorri para os dedicados.',
    'Tesouro em expansão! Sua jornada financeira está evoluindo.',
  ],
  critical: [
    'VITÓRIA ÉPICA! Entrada massiva de recursos no tesouro!',
    'Conquista lendária! Seu esforço está sendo muito recompensado!',
    'Jackpot financeiro! Este ganho é digno de celebração!',
    'Momento histórico! Grande entrada que marca sua jornada!',
  ],
};

// ========== FALLBACK NARRATIVES ==========

const FALLBACK_EXPENSE = [
  'Transação registrada com sucesso. Continue monitorando seus gastos!',
  'Gasto anotado no diário financeiro. Siga em frente, herói!',
  'Despesa contabilizada. Mantenha o foco nos seus objetivos.',
];

const FALLBACK_INCOME = [
  'Receita registrada! Seu tesouro agradece.',
  'Entrada anotada no diário financeiro. Ótimo trabalho!',
  'Ganho contabilizado. Continue conquistando!',
];

/**
 * Generate a static narrative for a transaction
 * This replaces the AI-powered narrative engine
 */
export const generateStaticNarrative = (
  amount: number,
  category: string,
  type: EventType,
  monthlyAverage: number = 0
): NarrativeResult => {
  // Calculate impact
  const impact = calcImpact(amount, monthlyAverage || amount * 10);
  
  if (type === 'INCOME') {
    const narratives = INCOME_NARRATIVES[impact];
    return {
      narrative: pickRandom(narratives) || pickRandom(FALLBACK_INCOME),
      impact,
    };
  }
  
  // For expenses, map category to RPG category
  const rpgCategory = CATEGORY_TO_RPG[category] || 'impulse';
  const categoryNarratives = EXPENSE_NARRATIVES[impact][rpgCategory];
  
  if (categoryNarratives && categoryNarratives.length > 0) {
    return {
      narrative: pickRandom(categoryNarratives),
      impact,
    };
  }
  
  // Fallback
  return {
    narrative: pickRandom(FALLBACK_EXPENSE),
    impact,
  };
};

// Re-export for compatibility
export { calcImpact as calculateImpact };
