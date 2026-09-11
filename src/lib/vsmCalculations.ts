import { VSMStep, TimeUnit, WasteType, WasteMeta, BottleneckAnalysis } from '@/types/vsm';

export function convertTimeToHours(value: number, unit: TimeUnit, isWorkingDay = true): number {
  if (isNaN(value) || value <= 0) return 0;
  switch (unit) {
    case 'minutos':
      return value / 60;
    case 'horas':
      return value;
    case 'dias':
      return isWorkingDay ? value * 8 : value * 24;
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
  if (hours < 8) {
    const formatted = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
    return `${formatted} h`;
  }
  const days = hours / 8;
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
  const days = (hours / 8).toFixed(1);
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
      overallYield: 100
    };
  }

  let totalWaitHours = 0;
  let totalProcessHours = 0;

  let maxWaitStep: VSMStep | null = null;
  let maxWaitHours = -1;

  let maxProcessStep: VSMStep | null = null;
  let maxProcessHours = -1;

  let lowestAccuracyStep: VSMStep | null = null;
  let minAccuracy = 101;

  let cumulativeYield = 1.0;

  steps.forEach(step => {
    const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
    const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

    totalProcessHours += ptHours;
    totalWaitHours += wtHours;

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

  const totalLeadTimeHours = totalWaitHours + totalProcessHours;
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
    overallYield
  };
}

export function getFlowEfficiencyClassification(efficiency: number): {
  status: 'critico' | 'tipico' | 'bom' | 'excelente';
  label: string;
  badgeClass: string;
  recommendation: string;
} {
  if (efficiency < 5) {
    return {
      status: 'critico',
      label: 'Crítico / Típico Adm (<5%)',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      recommendation: 'Mais de 95% do tempo do processo é puro desperdício em filas e esperas. Foco prioritário em eliminação de handoffs e burocracia.'
    };
  }
  if (efficiency < 15) {
    return {
      status: 'tipico',
      label: 'Moderado (5% a 15%)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      recommendation: 'Fluxo intermediário com oportunidades claras de paralelização e automação de aprovações.'
    };
  }
  if (efficiency < 30) {
    return {
      status: 'bom',
      label: 'Bom (15% a 30%)',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      recommendation: 'Bom nível de fluidez para processos corporativos. Próximo passo: otimizar tempos de processamento (PT).'
    };
  }
  return {
    status: 'excelente',
    label: 'World Class (>30%)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    recommendation: 'Excelente eficiência de fluxo enxuto. Processo altamente integrado e contínuo.'
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
