import { VSMStep, TimeUnit, WasteType, WasteMeta, BottleneckAnalysis, FutureStateMetrics } from '@/types/vsm';

/**
 * Convenção de jornada de trabalho:
 * 1 dia útil = 8 horas e 48 minutos (44h semanais / 5 dias = 8.8 horas).
 */
export const HOURS_PER_WORK_DAY = 8.8;

export function convertTimeToHours(value: number, unit: TimeUnit, isWorkingDay = true): number {
  if (isNaN(value) || value <= 0) return 0;
  switch (unit) {
    case 'minutos':
      return value / 60;
    case 'horas':
      return value;
    case 'dias':
      return isWorkingDay ? value * HOURS_PER_WORK_DAY : value * 24;
    default:
      return value;
  }
}

export function formatHours(hours: number): string {
  if (hours <= 0) return '0 min';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} min`;
  }
  if (hours < HOURS_PER_WORK_DAY) {
    const formatted = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
    return `${formatted} h`;
  }
  const days = hours / HOURS_PER_WORK_DAY;
  if (days >= 1) {
    const daysFormatted = days % 1 === 0 ? days.toFixed(0) : days.toFixed(1);
    return `${daysFormatted}d úteis (${hours.toFixed(1)}h)`;
  }
  return `${hours.toFixed(1)} h`;
}

export function formatHoursCompact(hours: number): string {
  if (hours <= 0) return '0m';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = (hours / HOURS_PER_WORK_DAY).toFixed(1);
  return `${days}d`;
}

export const WASTE_METAS: Record<WasteType, WasteMeta> = {
  espera: {
    type: 'espera',
    label: 'Espera & Fila',
    shortLabel: 'Espera',
    description: 'Aguardando aprovação, e-mail, retorno de terceiro ou fila de atendimento.',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
  },
  retrabalho: {
    type: 'retrabalho',
    label: 'Retrabalho & Erros',
    shortLabel: 'Retrabalho',
    description: 'Correção de formulários com erro, reenvio de dados incompletos ou falhas.',
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
  },
  superprocessamento: {
    type: 'superprocessamento',
    label: 'Superprocessamento',
    shortLabel: 'Excesso Processo',
    description: 'Assinaturas redundantes, aprovações duplas e conferências desnecessárias.',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
  },
  movimentacao: {
    type: 'movimentacao',
    label: 'Handoffs & Dispersão',
    shortLabel: 'Handoffs',
    description: 'Trocas excessivas de mãos/setores e dispersão de canais (chat, e-mail, ERP).',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/30',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
  },
  excesso_informacao: {
    type: 'excesso_informacao',
    label: 'Inventário de Tarefas',
    shortLabel: 'Fila / Inbox',
    description: 'Acúmulo de requisições represadas na caixa de entrada sem fluxo contínuo.',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
  }
};

export const ROLE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Recrutador': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/35', dot: 'bg-cyan-400' },
  'Gestor': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/35', dot: 'bg-amber-400' },
  'Gestor Requisitante': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/35', dot: 'bg-amber-400' },
  'DP': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/35', dot: 'bg-emerald-400' },
  'Departamento Pessoal': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/35', dot: 'bg-emerald-400' },
  'TI': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/35', dot: 'bg-purple-400' },
  'TI / Acessos': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/35', dot: 'bg-purple-400' },
  'Candidato': { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/35', dot: 'bg-teal-400' },
  'Colaborador': { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/35', dot: 'bg-teal-400' },
  'Financeiro': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/35', dot: 'bg-blue-400' },
  'Diretoria': { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/35', dot: 'bg-rose-400' },
  'Compras': { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/35', dot: 'bg-indigo-400' },
  'RH': { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/35', dot: 'bg-sky-400' }
};

export function getRoleStyle(role: string) {
  const match = ROLE_COLOR_MAP[role];
  if (match) return match;
  return {
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400'
  };
}

/**
 * Extrai a lista de oportunidades Kaizen de uma etapa de forma resiliente.
 * Suporta tanto o novo array `kaizenList` quanto a string legada `kaizenNotes`.
 */
export function getStepKaizens(step: { kaizenList?: string[]; kaizenNotes?: string } | null | undefined): string[] {
  if (!step) return [];
  if (Array.isArray(step.kaizenList) && step.kaizenList.length > 0) {
    const list = step.kaizenList
      .map(k => (typeof k === 'string' ? k.trim() : ''))
      .filter(k => k.length > 0);
    if (list.length > 0) return list;
  }
  if (step.kaizenNotes && typeof step.kaizenNotes === 'string' && step.kaizenNotes.trim().length > 0) {
    const lines = step.kaizenNotes
      .split('\n')
      .map(l => l.replace(/^[•\-\*\d+\.\s]+/, '').trim())
      .filter(l => l.length > 0);
    return lines.length > 0 ? lines : [step.kaizenNotes.trim()];
  }
  return [];
}

/**
 * Agrupa etapas em estágios sequenciais do fluxo de valor.
 * Etapas concorrentes marcadas com `isParallel: true` pertencem ao mesmo estágio.
 * Se apenas uma etapa intermediária estiver marcada como paralela, ela é agrupada com a etapa
 * imediatamente anterior para formar o bloco simultâneo.
 */
export function groupStepsIntoStages(steps: VSMStep[]): VSMStep[][] {
  if (!steps || steps.length === 0) return [];

  const stages: VSMStep[][] = [];
  let currentParallel: VSMStep[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.isParallel) {
      // Se for a primeira da sequência e a etapa anterior for linear,
      // podemos agrupá-las se a sequência paralela for iniciada
      currentParallel.push(step);
    } else {
      if (currentParallel.length > 0) {
        if (currentParallel.length === 1 && stages.length > 0) {
          // Uma etapa única marcada como paralela se junta à anterior
          const prev = stages.pop()!;
          stages.push([...prev, ...currentParallel]);
        } else {
          stages.push(currentParallel);
        }
        currentParallel = [];
      }
      stages.push([step]);
    }
  }

  if (currentParallel.length > 0) {
    if (currentParallel.length === 1 && stages.length > 0) {
      const prev = stages.pop()!;
      stages.push([...prev, ...currentParallel]);
    } else {
      stages.push(currentParallel);
    }
  }

  return stages;
}

export function calculateVsmMetrics(steps: VSMStep[]): BottleneckAnalysis {
  if (!steps || steps.length === 0) {
    return {
      maxWaitStep: null,
      maxProcessStep: null,
      lowestAccuracyStep: null,
      totalWaitHours: 0,
      totalProcessHours: 0,
      totalLeadTimeHours: 0,
      flowEfficiency: 0,
      overallYield: 100,
      parallelStagesCount: 0,
      totalWorkContentHours: 0
    };
  }

  let totalWaitHours = 0;
  let totalProcessHours = 0;
  let totalLeadTimeHours = 0;
  let totalWorkContentHours = 0;

  let maxWaitStep: VSMStep | null = null;
  let maxWaitHours = -1;

  let maxProcessStep: VSMStep | null = null;
  let maxProcessHours = -1;

  let lowestAccuracyStep: VSMStep | null = null;
  let minAccuracy = 101;

  let cumulativeYield = 1.0;

  // Análise individual de etapas para gargalos e rendimento da qualidade (%C&A)
  steps.forEach(step => {
    const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
    const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

    totalWorkContentHours += ptHours;

    if (wtHours > maxWaitHours) {
      maxWaitHours = wtHours;
      maxWaitStep = step;
    }

    if (ptHours > maxProcessHours) {
      maxProcessHours = ptHours;
      maxProcessStep = step;
    }

    const accuracy = typeof step.percentCompleteAndAccurate === 'number' ? step.percentCompleteAndAccurate : 100;
    if (accuracy < minAccuracy) {
      minAccuracy = accuracy;
      lowestAccuracyStep = step;
    }

    const factor = Math.max(0, Math.min(100, accuracy)) / 100;
    cumulativeYield *= factor;
  });

  // Agrupamento em Estágios (Metodologia Lean Office / Caminho Crítico)
  const stages = groupStepsIntoStages(steps);
  let parallelStagesCount = 0;

  stages.forEach(stage => {
    if (stage.length === 1) {
      // Estágio Linear Simples: soma direta
      const step = stage[0];
      const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
      const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

      totalWaitHours += wtHours;
      totalProcessHours += ptHours;
      totalLeadTimeHours += (wtHours + ptHours);
    } else {
      // Estágio Paralelo (Concorrente): regido pelo Caminho Crítico (maior tempo)
      parallelStagesCount++;

      let criticalStep = stage[0];
      let maxStageLt = convertTimeToHours(criticalStep.waitTime, criticalStep.waitTimeUnit, true) +
                       convertTimeToHours(criticalStep.processTime, criticalStep.processTimeUnit, true);
      let maxStageWt = convertTimeToHours(criticalStep.waitTime, criticalStep.waitTimeUnit, true);

      for (let i = 1; i < stage.length; i++) {
        const s = stage[i];
        const wt = convertTimeToHours(s.waitTime, s.waitTimeUnit, true);
        const pt = convertTimeToHours(s.processTime, s.processTimeUnit, true);
        const lt = wt + pt;

        // Se o Lead Time deste ramo for maior, ou em empate de Lead Time tiver maior espera
        if (lt > maxStageLt || (lt === maxStageLt && wt > maxStageWt)) {
          maxStageLt = lt;
          maxStageWt = wt;
          criticalStep = s;
        }
      }

      const stageWt = convertTimeToHours(criticalStep.waitTime, criticalStep.waitTimeUnit, true);
      const stagePt = convertTimeToHours(criticalStep.processTime, criticalStep.processTimeUnit, true);

      totalWaitHours += stageWt;
      totalProcessHours += stagePt;
      totalLeadTimeHours += (stageWt + stagePt);
    }
  });

  const flowEfficiency = totalLeadTimeHours > 0 ? (totalProcessHours / totalLeadTimeHours) * 100 : 0;
  const overallYield = cumulativeYield * 100;

  return {
    maxWaitStep,
    maxProcessStep,
    lowestAccuracyStep,
    totalWaitHours,
    totalProcessHours,
    totalLeadTimeHours,
    flowEfficiency,
    overallYield,
    parallelStagesCount,
    totalWorkContentHours
  };
}

export interface FlowEfficiencyBenchmark {
  range: string;
  min: number;
  max: number;
  level: 'critico' | 'tipico' | 'alvo_rh' | 'classe_mundial';
  tier: 'critical' | 'moderate' | 'excellent' | 'world_class';
  title: string;
  badge: string;
  color: string;
  border: string;
  bg: string;
  descriptionRH: string;
  description: string;
  typicalCases: string;
  typicalScenario: string;
  target: string;
}

export const FLOW_EFFICIENCY_BENCHMARKS_HR: FlowEfficiencyBenchmark[] = [
  {
    range: '< 5%',
    min: 0,
    max: 5,
    level: 'critico',
    tier: 'critical',
    title: 'Crítico / Típico de RH Tradicional',
    badge: '< 5% • Típico RH Tradicional',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    descriptionRH: 'Mais de 95% do Lead Time é tempo morto/espera em caixas de entrada, vaivém de aprovações e filas de sistemas.',
    description: 'Mais de 95% do tempo total é pura espera em caixas de entrada de e-mail e filas.',
    typicalCases: 'Vaga aguardando dias por alinhamento; admissão parada esperando envio picado de documentos do candidato.',
    typicalScenario: 'Vagas aguardando aprovação em caixas de e-mail e documentos em vaivém.',
    target: 'Alavanca Lean: Eliminar esperas e burocracia de aprovação'
  },
  {
    range: '5% a 15%',
    min: 5,
    max: 15,
    level: 'tipico',
    tier: 'moderate',
    title: 'Padrão Corporativo Médio',
    badge: '5% a 15% • Padrão Médio',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    descriptionRH: 'Processos com SLAs formais definidos, mas ainda com handoffs manuais e dependência de aprovações hierárquicas.',
    description: 'Processos com SLAs definidos, mas ainda com múltiplos handoffs manuais entre RH, TI, DP e gestores.',
    typicalCases: 'Troca de e-mails para agendar entrevistas com gestores; chamados de TI abertos em fila para configuração de máquinas.',
    typicalScenario: 'Agendamentos manuais com gestores e abertura sequencial de chamados de TI.',
    target: 'Alvo: Evoluir para 15% a 25% com paralelismo e automação'
  },
  {
    range: '15% a 25%',
    min: 15,
    max: 25,
    level: 'alvo_rh',
    tier: 'excellent',
    title: 'Alvo de Excelência Lean RH',
    badge: '15% a 25% • Alvo Lean RH',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    descriptionRH: 'Meta de ouro para workshops Lean em RH. Eliminação de lotes, paralelismo de etapas e aprovações pré-alinhadas.',
    description: 'Meta de ouro recomendada para workshops Lean Six Sigma em RH (Best Practice corporativo).',
    typicalCases: 'Agendamento self-service pelo candidato via link (Calendly); exames médicos e acessos de TI simultâneos.',
    typicalScenario: 'Autoagendamento pelo candidato (self-service) e tarefas em paralelo sem bloqueios.',
    target: 'Meta recomendada de sustentação em workshops Lean RH'
  },
  {
    range: '> 25%',
    min: 25,
    max: 100,
    level: 'classe_mundial',
    tier: 'world_class',
    title: 'Classe Mundial em Serviços & RH Ágil',
    badge: '> 25% • Classe Mundial',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    descriptionRH: 'Processo altamente integrado, quase em tempo real. Automações digitais, assinaturas eletrônicas instantâneas e esteira ágil.',
    description: 'Fluxo contínuo digital de altíssima velocidade com automações e autosserviço ponta a ponta.',
    typicalCases: 'Admissão 100% digital com validação automática de dados via OCR em minutos; integração sem papel e sem filas.',
    typicalScenario: 'Admissão digital ponta a ponta com OCR, assinatura eletrônica instantânea e zero papel.',
    target: 'Padrão ouro de excelência e referência internacional'
  }
];

export interface BibliographicReference {
  id: string;
  author: string;
  work: string;
  year: number;
  publisherOrAward: string;
  contribution: string;
  benchmarkStatement: string;
}

export const FLOW_EFFICIENCY_BIBLIOGRAPHY: BibliographicReference[] = [
  {
    id: 'karen-martin-vsm',
    author: 'Karen Martin & Mike Osterling',
    work: 'Value Stream Mapping for the Office and Complete Services',
    year: 2014,
    publisherOrAward: 'Productivity Press (Ganhador do Prêmio Shingo de Excelência em Pesquisa Operacional)',
    contribution: 'Referência mundial em Mapeamento do Fluxo de Valor aplicado a ambientes de escritório, serviços e trabalho cognitivo (RH, Financeiro, Compras).',
    benchmarkStatement: 'Documenta que em processos corporativos típicos não otimizados (Current State), a proporção de trabalho ativo em relação ao tempo total (Activity Ratio / Flow Efficiency) varia de 1% a 5%. Estabelece como meta recomendada de workshops Lean Office atingir entre 15% e 25% no Estado Futuro.'
  },
  {
    id: 'modig-this-is-lean',
    author: 'Niklas Modig & Pär Åhlström',
    work: 'This is Lean: Resolving the Efficiency Paradox (Isto é Lean: Resolvendo o Paradoxo da Eficiência)',
    year: 2012,
    publisherOrAward: 'Stockholm School of Economics / Rheologica Publishing',
    contribution: 'Obra seminal que introduziu e popularizou a distinção fundamental entre "Eficiência de Recursos" (manter pessoas ocupadas) e "Eficiência de Fluxo" (fazer o trabalho fluir rápido).',
    benchmarkStatement: 'Demonstra que organizações de serviços tradicionais operam com menos de 5% de Eficiência de Fluxo, com mais de 95% do tempo desperdiçado em esperas causadas por handoffs e silos organizacionais. Aponta que atingir 15% a 20%+ já representa um salto revolucionário de produtividade.'
  },
  {
    id: 'david-anderson-kanban',
    author: 'David J. Anderson',
    work: 'Kanban: Successful Evolutionary Change for Your Technology Business',
    year: 2010,
    publisherOrAward: 'Blue Hole Press / Kanban University',
    contribution: 'Pioneiro na quantificação de métricas de fluxo e leis de filas no trabalho do conhecimento e áreas corporativas.',
    benchmarkStatement: 'Mapeou centenas de fluxos de serviços e conhecimento: processos com filas ocultas registram eficiências médias entre 2% e 5%; fluxos com SLAs e gestão visual atingem de 5% a 15%; e times de alta maturidade com trabalho puxado alcançam de 15% a 25%.'
  },
  {
    id: 'reinertsen-flow',
    author: 'Donald G. Reinertsen',
    work: 'The Principles of Product Development Flow: Second Generation Lean Product Development',
    year: 2009,
    publisherOrAward: 'Celeritas Publishing',
    contribution: 'Formalizou a economia das filas, o custo do atraso (Cost of Delay) e a teoria matemática de filas (Queueing Theory) em trabalho não-fabril.',
    benchmarkStatement: 'Demonstra matematicamente como filas invisíveis e aprovações em lote destroem o Lead Time, comprovando que pequenas reduções de esperas geram ganhos exponenciais na Eficiência de Fluxo.'
  }
];

export function getFlowEfficiencyClassification(efficiency: number): {
  status: 'critico' | 'tipico' | 'bom' | 'excelente';
  label: string;
  badgeClass: string;
  recommendation: string;
  benchmarkTitle: string;
  benchmarkTarget: string;
} {
  if (efficiency < 5) {
    return {
      status: 'critico',
      label: 'Crítico / Típico RH (<5%)',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      recommendation: 'Mais de 95% do tempo do processo é puro desperdício em filas e esperas. Foco prioritário em eliminação de handoffs e burocracia.',
      benchmarkTitle: 'Típico RH Tradicional',
      benchmarkTarget: 'Meta inicial: alcançar de 5% a 15% cortando esperas'
    };
  }
  if (efficiency < 15) {
    return {
      status: 'tipico',
      label: 'Padrão Corporativo Médio (5% a 15%)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      recommendation: 'Fluxo intermediário com oportunidades claras de paralelização e automação de agendamentos e aprovações.',
      benchmarkTitle: 'Padrão Corporativo Médio',
      benchmarkTarget: 'Meta recomendada Lean RH: alcançar 15% a 25%'
    };
  }
  if (efficiency < 25) {
    return {
      status: 'bom',
      label: 'Alvo de Excelência Lean RH (15% a 25%)',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      recommendation: 'Excelente nível de fluidez para processos de RH e corporativos. Etapas em paralelo e SLAs enxutos.',
      benchmarkTitle: 'Alvo de Excelência Lean RH',
      benchmarkTarget: 'Manter estabilidade e avançar para Classe Mundial (>25%)'
    };
  }
  return {
    status: 'excelente',
    label: 'Classe Mundial em Serviços (>25%)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    recommendation: 'Eficiência de fluxo de classe mundial. Processo com esteira contínua, puxada e digital.',
    benchmarkTitle: 'Classe Mundial em Serviços & RH',
    benchmarkTarget: 'Referência máxima de maturidade Lean Office'
  };
}

export function countWastes(steps: VSMStep[]): Record<WasteType, number> {
  const counts: Record<WasteType, number> = {
    espera: 0,
    retrabalho: 0,
    superprocessamento: 0,
    movimentacao: 0,
    excesso_informacao: 0
  };

  steps.forEach(s => {
    s.wasteTypes?.forEach(w => {
      if (counts[w] !== undefined) {
        counts[w] += 1;
      }
    });
  });

  return counts;
}

/**
 * Calcula as métricas consolidadas do Estado Futuro (Target State)
 * baseando-se nas metas de WT futuro (e opcionalmente PT / %C&A) estipuladas
 * pela equipe no workshop. Se uma etapa não tiver WT futuro definido,
 * mantém o WT atual como valor de base.
 */
export function calculateFutureStateMetrics(
  steps: VSMStep[],
  currentMetrics?: BottleneckAnalysis
): FutureStateMetrics {
  const current = currentMetrics || calculateVsmMetrics(steps);

  if (!steps || steps.length === 0) {
    return {
      currentWaitHours: 0,
      futureWaitHours: 0,
      waitReductionHours: 0,
      waitReductionPercent: 0,
      currentLeadTimeHours: 0,
      futureLeadTimeHours: 0,
      leadTimeReductionPercent: 0,
      currentFlowEfficiency: 0,
      futureFlowEfficiency: 0,
      currentYield: 100,
      futureYield: 100,
      hasCustomEstimates: false,
      totalCustomStepsCount: 0
    };
  }

  let totalCustomStepsCount = 0;
  let cumulativeYield = 1.0;

  // Verifica etapas com estimativa customizada e calcula yield futuro
  steps.forEach(step => {
    if (typeof step.futureWaitTime === 'number') {
      totalCustomStepsCount++;
    }
    const futureAccuracy =
      typeof step.futurePercentCompleteAndAccurate === 'number'
        ? step.futurePercentCompleteAndAccurate
        : typeof step.percentCompleteAndAccurate === 'number'
        ? step.percentCompleteAndAccurate
        : 100;

    const factor = Math.max(0, Math.min(100, futureAccuracy)) / 100;
    cumulativeYield *= factor;
  });

  const hasCustomEstimates = totalCustomStepsCount > 0;

  let futureWaitHours = 0;
  let futureProcessHours = 0;
  let futureLeadTimeHours = 0;

  // Agrupa estágios futuros respeitando paralelismo e caminho crítico
  const stages = groupStepsIntoStages(steps);

  stages.forEach(stage => {
    if (stage.length === 1) {
      const step = stage[0];
      const wtHours =
        typeof step.futureWaitTime === 'number'
          ? convertTimeToHours(step.futureWaitTime, step.futureWaitTimeUnit || step.waitTimeUnit, true)
          : convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

      const ptHours =
        typeof step.futureProcessTime === 'number'
          ? convertTimeToHours(step.futureProcessTime, step.futureProcessTimeUnit || step.processTimeUnit, true)
          : convertTimeToHours(step.processTime, step.processTimeUnit, true);

      futureWaitHours += wtHours;
      futureProcessHours += ptHours;
      futureLeadTimeHours += (wtHours + ptHours);
    } else {
      // Estágio Paralelo: crítico pelo maior lead time futuro
      let criticalStep = stage[0];
      const getStepFutureLt = (s: VSMStep) => {
        const wt =
          typeof s.futureWaitTime === 'number'
            ? convertTimeToHours(s.futureWaitTime, s.futureWaitTimeUnit || s.waitTimeUnit, true)
            : convertTimeToHours(s.waitTime, s.waitTimeUnit, true);
        const pt =
          typeof s.futureProcessTime === 'number'
            ? convertTimeToHours(s.futureProcessTime, s.futureProcessTimeUnit || s.processTimeUnit, true)
            : convertTimeToHours(s.processTime, s.processTimeUnit, true);
        return { wt, pt, lt: wt + pt };
      };

      let maxInfo = getStepFutureLt(criticalStep);

      for (let i = 1; i < stage.length; i++) {
        const info = getStepFutureLt(stage[i]);
        if (info.lt > maxInfo.lt || (info.lt === maxInfo.lt && info.wt > maxInfo.wt)) {
          maxInfo = info;
          criticalStep = stage[i];
        }
      }

      futureWaitHours += maxInfo.wt;
      futureProcessHours += maxInfo.pt;
      futureLeadTimeHours += maxInfo.lt;
    }
  });

  const futureFlowEfficiency =
    futureLeadTimeHours > 0 ? (futureProcessHours / futureLeadTimeHours) * 100 : 0;

  const currentWait = current.totalWaitHours;
  const currentLt = current.totalLeadTimeHours;

  const waitReductionHours = Math.max(0, currentWait - futureWaitHours);
  const waitReductionPercent =
    currentWait > 0 ? Math.round(((currentWait - futureWaitHours) / currentWait) * 100) : 0;

  const leadTimeReductionPercent =
    currentLt > 0 ? Math.round(((currentLt - futureLeadTimeHours) / currentLt) * 100) : 0;

  return {
    currentWaitHours: currentWait,
    futureWaitHours,
    waitReductionHours,
    waitReductionPercent,
    currentLeadTimeHours: currentLt,
    futureLeadTimeHours,
    leadTimeReductionPercent,
    currentFlowEfficiency: current.flowEfficiency,
    futureFlowEfficiency,
    currentYield: current.overallYield,
    futureYield: Math.round(cumulativeYield * 1000) / 10,
    hasCustomEstimates,
    totalCustomStepsCount
  };
}

/**
 * Utilitários de Data para o Plano Kaizen 5W2H
 */
export function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  if (isoDate.includes('/')) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(baseDateISO: string, days: number): string {
  try {
    const [y, m, d] = baseDateISO.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return baseDateISO;
  }
}

export function calculateDateDiffDays(startISO?: string, endISO?: string): number | null {
  if (!startISO || !endISO) return null;
  try {
    const [sy, sm, sd] = startISO.split('-').map(Number);
    const [ey, em, ed] = endISO.split('-').map(Number);
    const d1 = new Date(sy, sm - 1, sd);
    const d2 = new Date(ey, em - 1, ed);
    const diffTime = d2.getTime() - d1.getTime();
    return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

