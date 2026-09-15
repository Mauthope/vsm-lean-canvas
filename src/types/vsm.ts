export type TimeUnit = 'minutos' | 'horas' | 'dias';

export type WasteType =
  | 'espera'
  | 'retrabalho'
  | 'superprocessamento'
  | 'movimentacao'
  | 'excesso_informacao';

export interface VSMStep {
  id: string;
  order: number;
  title: string;
  role: string; // Ex: Recrutador, DP, TI, Gestor, Candidato
  description?: string;
  processTime: number; // PT (Tempo de esforço real)
  processTimeUnit: TimeUnit;
  waitTime: number; // WT (Tempo parado em fila/espera)
  waitTimeUnit: TimeUnit;
  percentCompleteAndAccurate: number; // %C&A (0 a 100%)
  wasteTypes: WasteType[];
  kaizenNotes?: string; // Oportunidades de melhoria levantadas na sessão (mantido para retrocompatibilidade)
  kaizenList?: string[]; // Múltiplas oportunidades/raios de Kaizen na mesma etapa
  isParallel?: boolean;
  // Campos de Projeção do Estado Futuro (Estipulados pela equipe)
  futureWaitTime?: number; // WT estimado no estado futuro
  futureWaitTimeUnit?: TimeUnit; // Unidade do WT futuro (padrão: mesma de waitTimeUnit)
  futureProcessTime?: number; // PT estimado no estado futuro (opcional)
  futureProcessTimeUnit?: TimeUnit;
  futurePercentCompleteAndAccurate?: number; // %C&A estimado no estado futuro (opcional)
}

export interface FutureStateMetrics {
  currentWaitHours: number;
  futureWaitHours: number;
  waitReductionHours: number;
  waitReductionPercent: number;
  currentLeadTimeHours: number;
  futureLeadTimeHours: number;
  leadTimeReductionPercent: number;
  currentFlowEfficiency: number;
  futureFlowEfficiency: number;
  currentYield: number;
  futureYield: number;
  hasCustomEstimates: boolean;
  totalCustomStepsCount: number;
}

export type KaizenHorizon = '30_dias' | '60_dias' | '90_dias';

export interface KaizenAction5W2H {
  id: string;
  stepId?: string; // Etapa vinculada (opcional)
  stepOrder?: number;
  what: string; // O que fazer (Ação Kaizen)
  why: string; // Por que fazer (Meta de redução de WT / eliminação de desperdício)
  where: string; // Onde será aplicado (Etapa / Setor)
  who: string; // Quem é o responsável direto (Nome da pessoa física, não o cargo)
  startDate?: string; // Data inicial (YYYY-MM-DD)
  endDate?: string; // Data final / Prazo (YYYY-MM-DD)
  when?: KaizenHorizon | string; // Mantido para retrocompatibilidade
  how?: string; // Como fazer (Opcional / simplificado no workshop)
  howMuch?: string; // Quanto custa (Opcional, default "Esforço interno" ou valor)
  status?: 'planejado' | 'em_andamento' | 'concluido';
  createdAt?: string;
}

export interface VSMProject {
  id: string;
  name: string; // Ex: "Mapeamento Admissão e Onboarding"
  department: string;
  leadTimeHours: number;
  totalProcessTimeHours: number;
  flowEfficiency: number; // %
  overallYield: number; // % Rolled First Pass Yield (multiplicação dos %C&A)
  steps: VSMStep[];
  kaizenRoadmap?: KaizenAction5W2H[];
}

export interface WasteMeta {
  type: WasteType;
  label: string;
  shortLabel: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}

export interface BottleneckAnalysis {
  maxWaitStep: VSMStep | null;
  maxProcessStep: VSMStep | null;
  lowestAccuracyStep: VSMStep | null;
  totalWaitHours: number;
  totalProcessHours: number;
  totalLeadTimeHours: number;
  flowEfficiency: number;
  overallYield: number;
  parallelStagesCount?: number;
  totalWorkContentHours?: number;
}

export interface VSMTemplate {
  id: string;
  name: string;
  department: string;
  description: string;
  steps: (Omit<VSMStep, 'id'> | VSMStep)[];
  kaizenRoadmap?: KaizenAction5W2H[];
  createdAt?: string;
  isCustom?: boolean;
}

export interface CustomWorkshop {
  id: string;
  name: string;
  department: string;
  description?: string;
  steps: VSMStep[];
  kaizenRoadmap?: KaizenAction5W2H[];
  createdAt: string;
  updatedAt: string;
}
