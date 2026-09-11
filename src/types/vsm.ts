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
  kaizenNotes?: string; // Oportunidades de melhoria levantadas na sessão
  isParallel?: boolean;
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
}

export interface VSMTemplate {
  id: string;
  name: string;
  department: string;
  description: string;
  steps: Omit<VSMStep, 'id'>[];
}
