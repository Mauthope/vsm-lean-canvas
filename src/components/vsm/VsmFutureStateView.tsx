'use client';

import React, { useMemo } from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle2,
  Percent,
  Layers,
  ArrowRight,
  RotateCcw,
  Copy,
  Printer,
  HelpCircle,
  Lightbulb,
  Check,
  Flame,
  GitBranch,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Trash2,
  ClipboardList,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Calendar,
  Target,
  Search
} from 'lucide-react';
import {
  VSMStep,
  TimeUnit,
  BottleneckAnalysis,
  FutureStateMetrics,
  KaizenAction5W2H,
  KaizenHorizon
} from '@/types/vsm';
import {
  formatHours,
  formatHoursCompact,
  getFlowEfficiencyClassification,
  FLOW_EFFICIENCY_BENCHMARKS_HR,
  convertTimeToHours,
  HOURS_PER_WORK_DAY,
  getRoleStyle,
  getStepKaizens,
  calculateFutureStateMetrics,
  formatDateBR,
  getTodayISO,
  addDaysISO,
  calculateDateDiffDays
} from '@/lib/vsmCalculations';

interface VsmFutureStateViewProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onUpdateStep: (stepId: string, updates: Partial<VSMStep>) => void;
  onOpenReportModal: () => void;
  onOpenGlossary?: (topic?: string) => void;
  onSelectStep?: (stepId: string) => void;
  kaizenRoadmap?: KaizenAction5W2H[];
  onUpdateKaizenRoadmap?: (roadmap: KaizenAction5W2H[]) => void;
}

export const VsmFutureStateView: React.FC<VsmFutureStateViewProps> = ({
  steps,
  metrics,
  onUpdateStep,
  onOpenReportModal,
  onOpenGlossary,
  onSelectStep,
  kaizenRoadmap = [],
  onUpdateKaizenRoadmap
}) => {
  // Cálculo rigoroso das métricas futuras em tempo real
  const futureMetrics: FutureStateMetrics = useMemo(() => {
    return calculateFutureStateMetrics(steps, metrics);
  }, [steps, metrics]);

  // Conversão de dias úteis (8h48m = 8.8h)
  const currentLtDays = (futureMetrics.currentLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1);
  const futureLtDays = (futureMetrics.futureLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1);
  const currentWaitDays = (futureMetrics.currentWaitHours / HOURS_PER_WORK_DAY).toFixed(1);
  const futureWaitDays = (futureMetrics.futureWaitHours / HOURS_PER_WORK_DAY).toFixed(1);

  const efficiencyMetaCurrent = getFlowEfficiencyClassification(futureMetrics.currentFlowEfficiency);
  const efficiencyMetaFuture = getFlowEfficiencyClassification(futureMetrics.futureFlowEfficiency);

  // Ação Rápida 1: Copiar WT Atual como base para o Futuro em todas as etapas
  const handleCopyCurrentToFuture = () => {
    steps.forEach(step => {
      onUpdateStep(step.id, {
        futureWaitTime: step.waitTime,
        futureWaitTimeUnit: step.waitTimeUnit
      });
    });
  };

  // Ação Rápida 2: Aplicar sugestão Lean de -50% nas etapas que possuem Kaizen
  const handleApplyKaizenFiftyPercent = () => {
    steps.forEach(step => {
      const kaizens = getStepKaizens(step);
      if (kaizens.length > 0) {
        const reduced = Math.max(0, Math.round((step.waitTime * 0.5) * 10) / 10);
        onUpdateStep(step.id, {
          futureWaitTime: reduced,
          futureWaitTimeUnit: step.waitTimeUnit
        });
      } else if (typeof step.futureWaitTime !== 'number') {
        // Se não tem Kaizen e não foi mexido, mantém igual
        onUpdateStep(step.id, {
          futureWaitTime: step.waitTime,
          futureWaitTimeUnit: step.waitTimeUnit
        });
      }
    });
  };

  // Ação Rápida 3: Limpar todas as estimativas futuras (resetar para baseline)
  const handleResetFutureEstimates = () => {
    if (confirm('Deseja limpar todas as metas de WT futuro estipuladas nesta sessão?')) {
      steps.forEach(step => {
        onUpdateStep(step.id, {
          futureWaitTime: undefined,
          futureWaitTimeUnit: undefined
        });
      });
    }
  };

  // Ações Rápidas por linha individual
  const setStepReduction = (step: VSMStep, percentDiscount: number) => {
    const factor = Math.max(0, 1 - (percentDiscount / 100));
    const newWt = Math.max(0, Math.round((step.waitTime * factor) * 10) / 10);
    onUpdateStep(step.id, {
      futureWaitTime: newWt,
      futureWaitTimeUnit: step.futureWaitTimeUnit || step.waitTimeUnit
    });
  };

  // =========================================================================
  // GESTÃO DO PLANO DE AÇÃO KAIZEN (5W2H) INTEGRADO NA MATRIZ DO WORKSHOP
  // =========================================================================
  type StepFilterMode = 'all' | 'with_kaizen' | 'with_5w2h' | 'missing_leader';
  const [stepFilter, setStepFilter] = React.useState<StepFilterMode>('all');
  const [stepSearch, setStepSearch] = React.useState('');
  const [expandedSteps5W2H, setExpandedSteps5W2H] = React.useState<Record<string, boolean>>({});

  const handleCollapseAllSteps5W2H = () => {
    setExpandedSteps5W2H({});
  };

  const allSteps5W2HExpanded = steps.length > 0 && steps.every(s => Boolean(expandedSteps5W2H[s.id]));

  // Estatísticas de facilitação do workshop
  const workshopStats = useMemo(() => {
    const totalActions = (kaizenRoadmap || []).length;
    const actionsWithLeader = (kaizenRoadmap || []).filter(a => a.who && a.who.trim()).length;
    const actionsMissingLeader = totalActions - actionsWithLeader;
    const stepsWith5W2H = new Set((kaizenRoadmap || []).map(a => a.stepId).filter(Boolean)).size;
    const stepsWithKaizen = steps.filter(s => getStepKaizens(s).length > 0).length;

    return {
      totalActions,
      actionsWithLeader,
      actionsMissingLeader,
      stepsWith5W2H,
      stepsWithKaizen
    };
  }, [kaizenRoadmap, steps]);

  // Lista de etapas filtradas para visualização dinâmica no workshop
  const filteredSteps = useMemo(() => {
    return steps.filter(step => {
      const kaizens = getStepKaizens(step);
      const stepActions = (kaizenRoadmap || []).filter(a => a.stepId === step.id);
      const hasMissingLeader = stepActions.some(a => !a.who || !a.who.trim());

      // Filtro por modo
      if (stepFilter === 'with_kaizen' && kaizens.length === 0) return false;
      if (stepFilter === 'with_5w2h' && stepActions.length === 0) return false;
      if (stepFilter === 'missing_leader' && (!hasMissingLeader || stepActions.length === 0)) return false;

      // Busca por texto (título, papel, kaizens ou responsável)
      if (stepSearch.trim()) {
        const q = stepSearch.toLowerCase();
        const matchTitle = step.title.toLowerCase().includes(q);
        const matchRole = step.role.toLowerCase().includes(q);
        const matchKaizen = kaizens.some(k => k.toLowerCase().includes(q));
        const matchAction = stepActions.some(
          a => a.what.toLowerCase().includes(q) || a.who.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchRole && !matchKaizen && !matchAction) return false;
      }

      return true;
    });
  }, [steps, kaizenRoadmap, stepFilter, stepSearch]);

  // Ação Rápida 5W2H: Gerar rascunho de ações a partir de todos os Kaizens
  const handleGenerate5W2HDraft = () => {
    const draftActions: KaizenAction5W2H[] = [];
    const today = getTodayISO();

    steps.forEach(step => {
      const kaizens = getStepKaizens(step);
      const hasCustom = typeof step.futureWaitTime === 'number';
      const currentWtH = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
      const futureWtH = hasCustom
        ? convertTimeToHours(step.futureWaitTime!, step.futureWaitTimeUnit || step.waitTimeUnit, true)
        : currentWtH;
      const diffH = currentWtH - futureWtH;
      const diffPct = currentWtH > 0 ? Math.round((diffH / currentWtH) * 100) : 0;

      if (kaizens.length > 0) {
        kaizens.forEach((kText, idx) => {
          let days = 30;
          if (diffPct >= 75 || /automa|sistema|integra|portal|api/i.test(kText)) {
            days = 60;
          }
          if (/desenvolv|erp|software|contrat|reestrutur/i.test(kText)) {
            days = 90;
          }

          const whyText = diffH > 0
            ? `Reduzir tempo de espera de ${step.waitTime} ${step.waitTimeUnit} para ${step.futureWaitTime} ${step.futureWaitTimeUnit || step.waitTimeUnit} (-${diffPct}%) e acelerar o fluxo.`
            : `Eliminar desperdícios operacionais e elevar qualidade na etapa #${step.order}.`;

          draftActions.push({
            id: `action-${Date.now()}-${step.id}-${idx}`,
            stepId: step.id,
            stepOrder: step.order,
            what: kText,
            why: whyText,
            where: `Etapa #${step.order} • ${step.title}`,
            who: '', // Nome do responsável (pessoa física) a ser pactuado no workshop
            startDate: today,
            endDate: addDaysISO(today, days),
            how: 'Padronização de procedimento operacional e alinhamento do time',
            howMuch: 'Esforço interno (sem investimento direto)',
            status: 'planejado',
            createdAt: new Date().toISOString()
          });
        });
      } else if (hasCustom && diffH > 0) {
        const days = diffPct > 50 ? 60 : 30;
        draftActions.push({
          id: `action-${Date.now()}-${step.id}-gen`,
          stepId: step.id,
          stepOrder: step.order,
          what: `Otimização do fluxo e eliminação de tempo morto na etapa "${step.title}"`,
          why: `Garantir a meta pactuada de redução do WT em ${formatHoursCompact(diffH)} (-${diffPct}%).`,
          where: `Etapa #${step.order} • ${step.title}`,
          who: '', // Nome do responsável (pessoa física)
          startDate: today,
          endDate: addDaysISO(today, days),
          how: 'Revisão das regras de passagem e eliminação de lotes de espera',
          howMuch: 'Esforço interno',
          status: 'planejado',
          createdAt: new Date().toISOString()
        });
      }
    });

    if (draftActions.length === 0) {
      draftActions.push({
        id: `action-${Date.now()}-init`,
        what: 'Workshop de alinhamento para implantação das metas do Estado Futuro',
        why: 'Mobilizar a equipe e formalizar os novos prazos de atendimento (SLAs)',
        where: 'Fluxo de Valor Geral',
        who: '',
        startDate: today,
        endDate: addDaysISO(today, 30),
        how: 'Reunião de kickoff e definição do comitê de acompanhamento Kaizen',
        howMuch: 'Esforço interno',
        status: 'planejado',
        createdAt: new Date().toISOString()
      });
    }

    const applyDraft = () => {
      onUpdateKaizenRoadmap?.(draftActions);
      // Abre as gavetas 5W2H das etapas que receberam ações
      const nextExpanded: Record<string, boolean> = {};
      draftActions.forEach(a => {
        if (a.stepId) nextExpanded[a.stepId] = true;
      });
      setExpandedSteps5W2H(nextExpanded);
    };

    if ((kaizenRoadmap || []).length > 0) {
      if (confirm(`Já existem ${kaizenRoadmap.length} ações cadastradas. Deseja substituir pelo novo rascunho dos Kaizens mapeados?`)) {
        applyDraft();
      }
    } else {
      applyDraft();
    }
  };

  // Adicionar Nova Ação 5W2H para uma Etapa
  const handleAddNewAction = (step?: VSMStep) => {
    const today = getTodayISO();
    let whyText = 'Melhoria contínua do fluxo de valor';
    if (step) {
      const hasCustom = typeof step.futureWaitTime === 'number';
      const currentWtH = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
      const futureWtH = hasCustom
        ? convertTimeToHours(step.futureWaitTime!, step.futureWaitTimeUnit || step.waitTimeUnit, true)
        : currentWtH;
      const diffH = currentWtH - futureWtH;
      const diffPct = currentWtH > 0 ? Math.round((diffH / currentWtH) * 100) : 0;
      whyText = diffH > 0
        ? `Viabilizar a redução do WT de ${step.waitTime} ${step.waitTimeUnit} para ${step.futureWaitTime} ${step.futureWaitTimeUnit || step.waitTimeUnit} (-${diffPct}%)`
        : `Eliminar desperdícios e reduzir tempo de fila na etapa #${step.order}`;
    }

    const newAction: KaizenAction5W2H = {
      id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stepId: step?.id,
      stepOrder: step?.order,
      what: '',
      why: whyText,
      where: step ? `Etapa #${step.order} • ${step.title}` : 'Fluxo Geral',
      who: '', // Nome da pessoa física responsável
      startDate: today,
      endDate: addDaysISO(today, 30),
      how: '',
      howMuch: 'Esforço interno (R$ 0)',
      status: 'planejado',
      createdAt: new Date().toISOString()
    };
    onUpdateKaizenRoadmap?.([...(kaizenRoadmap || []), newAction]);
    if (step) {
      setExpandedSteps5W2H(prev => ({ ...prev, [step.id]: true }));
    }
  };

  // Alternar visualização da gaveta 5W2H de uma etapa (com inicialização automática caso esteja vazia)
  const toggleStep5W2H = (step: VSMStep) => {
    const isOpening = !expandedSteps5W2H[step.id];
    setExpandedSteps5W2H(prev => ({ ...prev, [step.id]: !prev[step.id] }));

    if (isOpening) {
      const existing = (kaizenRoadmap || []).filter(a => a.stepId === step.id);
      if (existing.length === 0) {
        handleAddNewAction(step);
      }
    }
  };

  // Expandir todas as etapas com inicialização de ações vazias
  const handleExpandAllSteps5W2H = () => {
    const next: Record<string, boolean> = {};
    const newRoadmap = [...(kaizenRoadmap || [])];
    let changed = false;

    steps.forEach(s => {
      next[s.id] = true;
      const hasAction = newRoadmap.some(a => a.stepId === s.id);
      if (!hasAction) {
        const today = getTodayISO();
        const hasCustom = typeof s.futureWaitTime === 'number';
        const currentWtH = convertTimeToHours(s.waitTime, s.waitTimeUnit, true);
        const futureWtH = hasCustom
          ? convertTimeToHours(s.futureWaitTime!, s.futureWaitTimeUnit || s.waitTimeUnit, true)
          : currentWtH;
        const diffH = currentWtH - futureWtH;
        const diffPct = currentWtH > 0 ? Math.round((diffH / currentWtH) * 100) : 0;
        const whyText = diffH > 0
          ? `Viabilizar a redução do WT de ${s.waitTime} ${s.waitTimeUnit} para ${s.futureWaitTime} ${s.futureWaitTimeUnit || s.waitTimeUnit} (-${diffPct}%)`
          : `Eliminar desperdícios e acelerar a etapa #${s.order}`;

        newRoadmap.push({
          id: `action-${Date.now()}-${s.id}-${Math.random().toString(36).substring(2, 6)}`,
          stepId: s.id,
          stepOrder: s.order,
          what: '',
          why: whyText,
          where: `Etapa #${s.order} • ${s.title}`,
          who: '',
          startDate: today,
          endDate: addDaysISO(today, 30),
          how: '',
          howMuch: 'Esforço interno (R$ 0)',
          status: 'planejado',
          createdAt: new Date().toISOString()
        });
        changed = true;
      }
    });

    if (changed) {
      onUpdateKaizenRoadmap?.(newRoadmap);
    }
    setExpandedSteps5W2H(next);
  };

  const handleUpdateAction = (actionId: string, updates: Partial<KaizenAction5W2H>) => {
    if (!onUpdateKaizenRoadmap) return;
    const updated = (kaizenRoadmap || []).map(a => (a.id === actionId ? { ...a, ...updates } : a));
    onUpdateKaizenRoadmap(updated);
  };

  const handleDeleteAction = (actionId: string) => {
    if (!onUpdateKaizenRoadmap) return;
    const updated = (kaizenRoadmap || []).filter(a => a.id !== actionId);
    onUpdateKaizenRoadmap(updated);
  };

  const handleClearRoadmap = () => {
    if (confirm('Deseja remover todas as ações 5W2H pactuadas?')) {
      onUpdateKaizenRoadmap?.([]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner da Visão do Estado Futuro */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Padrão Lean Six Sigma • Target State</span>
              </span>
              {futureMetrics.hasCustomEstimates && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                  {futureMetrics.totalCustomStepsCount} de {steps.length} etapas com metas pactuadas
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight flex items-center gap-2">
              Visão do Estado Futuro Enxuto
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Discuta com os participantes do workshop o impacto dos <strong>Kaizens</strong> levantados e estipule a redução no <strong>Tempo de Fila (WT)</strong> de cada etapa. Os novos marcos e o relatório executivo atualizam instantaneamente.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {onOpenGlossary && (
              <button
                type="button"
                onClick={() => onOpenGlossary('future_state')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
                title="Aprender por que o Estado Futuro é a essência do Lean Six Sigma"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Por que Estado Futuro?</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Ver no Relatório / Imprimir</span>
            </button>
          </div>
        </div>

        {/* 2. Grid de KPIs Comparativos (Antes vs Depois) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          
          {/* Card 1: Redução de Lead Time Total */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Lead Time Total (Ponta a Ponta)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {futureMetrics.leadTimeReductionPercent > 0 ? `-${futureMetrics.leadTimeReductionPercent}%` : '0%'}
                </span>
                <span className="text-xs font-mono text-emerald-300 font-bold">
                  de redução
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>De: <strong className="text-slate-200">~{currentLtDays}d</strong></span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
              <span>Para: <strong className="text-emerald-300">~{futureLtDays} dias úteis</strong></span>
            </div>
          </div>

          {/* Card 2: Horas de Espera (WT) Eliminadas */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Fila / Espera Total (WT)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  -{futureMetrics.waitReductionHours.toFixed(1)}h
                </span>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  eliminadas
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>De: <strong className="text-slate-200">{futureMetrics.currentWaitHours.toFixed(1)}h</strong></span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
              <span>Para: <strong className="text-amber-300">{futureMetrics.futureWaitHours.toFixed(1)}h (-{futureMetrics.waitReductionPercent}%)</strong></span>
            </div>
          </div>

          {/* Card 3: Salto na Eficiência de Fluxo */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                  Eficiência de Fluxo (FE)
                </span>
                {onOpenGlossary && (
                  <button
                    type="button"
                    onClick={() => onOpenGlossary('fe')}
                    className="text-[10px] font-mono text-cyan-400/90 hover:text-cyan-300 underline cursor-pointer"
                    title="Ver referências Lean RH para Eficiência de Fluxo"
                  >
                    Ref. RH: 5% a 15%
                  </button>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  {futureMetrics.futureFlowEfficiency.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  (+{(futureMetrics.futureFlowEfficiency - futureMetrics.currentFlowEfficiency).toFixed(1)} pp)
                </span>
              </div>
              <div className="text-[10px] font-mono text-cyan-300/90 font-medium mt-0.5">
                {efficiencyMetaFuture.label}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>De: <strong className="text-slate-200">{futureMetrics.currentFlowEfficiency.toFixed(1)}%</strong> ({efficiencyMetaCurrent.label.split(' ')[0]})</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span>Para: <strong className="text-cyan-300">{futureMetrics.futureFlowEfficiency.toFixed(1)}%</strong> ({efficiencyMetaFuture.label.split(' ')[0]})</span>
            </div>
          </div>

          {/* Card 4: Rendimento sem Retrabalho (%C&A) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Rendimento Rolado (RFPY)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
                  {futureMetrics.futureYield.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-purple-300 font-bold">
                  sem retrabalho
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Atual: <strong className="text-slate-200">{futureMetrics.currentYield.toFixed(1)}%</strong></span>
              <ArrowRight className="w-3 h-3 text-purple-400" />
              <span>Meta: <strong className="text-purple-300">{futureMetrics.futureYield.toFixed(1)}%</strong></span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Barra de Ações Rápidas de Discussão Lean */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-xs font-bold text-white font-heading block">
              Ferramentas de Facilitação do Workshop
            </span>
            <span className="text-[11px] text-slate-400">
              Acelere a dinâmica usando preenchimentos automáticos ou edite diretamente na tabela abaixo.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyCurrentToFuture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Preenche o WT futuro de todas as etapas com o valor atual para que a equipe ajuste individualmente"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Copiar WT Atual</span>
          </button>

          <button
            type="button"
            onClick={handleApplyKaizenFiftyPercent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
            title="Reduz o WT em 50% nas etapas que possuem ideias Kaizen cadastradas"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sugerir -50% nas com Kaizen</span>
          </button>

          {futureMetrics.hasCustomEstimates && (
            <button
              type="button"
              onClick={handleResetFutureEstimates}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition-all cursor-pointer"
              title="Reseta todos os valores estipulados para o estado base"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Metas</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabela Interativa: Matriz Auditável do Fluxo de Valor - Estado Futuro */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
        {/* Header e Toolbar de Facilitação do Workshop */}
        <div className="space-y-3 pb-4 border-b border-slate-800 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2 flex-wrap">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span>Matriz Auditável do Fluxo de Valor • Estado Futuro & Planos 5W2H</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                  {steps.length} etapas
                </span>
                {(kaizenRoadmap || []).length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-amber-400" />
                    <span>{(kaizenRoadmap || []).length} ação(ões) 5W2H pactuadas</span>
                  </span>
                )}
                {workshopStats.actionsMissingLeader > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span>⚠️ {workshopStats.actionsMissingLeader} sem líder</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
                Pactue o <strong>WT Futuro Estimado</strong> e defina logo abaixo de cada etapa as ações <strong>5W2H</strong> que viabilizarão o resultado durante o workshop.
              </p>
            </div>

            {/* Ações Globais de Facilitação do Workshop */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {onOpenGlossary && (
                <button
                  type="button"
                  onClick={() => onOpenGlossary('kaizen_5w2h')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  title="Entender a metodologia Lean 5W2H e prazos pactuados"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Por que 5W2H?</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerate5W2HDraft}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Converter automaticamente os Kaizens identificados no mapeamento em ações 5W2H para todas as etapas"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Sugerir 5W2H dos Kaizens</span>
              </button>

              <button
                type="button"
                onClick={allSteps5W2HExpanded ? handleCollapseAllSteps5W2H : handleExpandAllSteps5W2H}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Expandir ou recolher os formulários 5W2H de todas as etapas"
              >
                {allSteps5W2HExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
                <span>{allSteps5W2HExpanded ? 'Recolher Todos os 5W2H' : 'Expandir Todos os 5W2H'}</span>
              </button>

              {(kaizenRoadmap || []).length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRoadmap}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-colors text-xs cursor-pointer"
                  title="Limpar todas as ações 5W2H"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Barra de Filtros e Busca Rápida no Workshop */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 flex-wrap">
            {/* Filtros em Pílulas */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-500 mr-1">Filtrar:</span>
              <button
                type="button"
                onClick={() => setStepFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  stepFilter === 'all'
                    ? 'bg-slate-700 text-white font-bold border border-slate-600'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todas ({steps.length})
              </button>

              <button
                type="button"
                onClick={() => setStepFilter('with_kaizen')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  stepFilter === 'with_kaizen'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'bg-slate-950/80 text-slate-400 hover:text-amber-300 border border-slate-800'
                }`}
              >
                💡 Com Kaizens ({workshopStats.stepsWithKaizen})
              </button>

              <button
                type="button"
                onClick={() => setStepFilter('with_5w2h')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  stepFilter === 'with_5w2h'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'bg-slate-950/80 text-slate-400 hover:text-cyan-300 border border-slate-800'
                }`}
              >
                📋 Com 5W2H ({workshopStats.stepsWith5W2H})
              </button>

              {workshopStats.actionsMissingLeader > 0 && (
                <button
                  type="button"
                  onClick={() => setStepFilter('missing_leader')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    stepFilter === 'missing_leader'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 border border-rose-500/30'
                  }`}
                  title="Filtrar etapas que têm ações sem responsável definido"
                >
                  <span>⚠️ Sem Líder</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-[10px] font-black">
                    {workshopStats.actionsMissingLeader}
                  </span>
                </button>
              )}
            </div>

            {/* Campo de Busca Rápida */}
            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar etapa, kaizen, líder..."
                value={stepSearch}
                onChange={e => setStepSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[180px]">Título da Etapa</th>
                <th className="p-3 whitespace-nowrap">Responsável</th>
                <th className="p-3 min-w-[260px] text-amber-400 font-bold">Oportunidades Kaizen (Ideias Mapeadas)</th>
                <th className="p-3 text-right">PT (Esforço)</th>
                <th className="p-3 text-right min-w-[110px]">WT Atual (Fila)</th>
                <th className="p-3 text-left min-w-[200px] bg-emerald-950/20 border-x border-emerald-500/20">
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" />
                    WT Futuro Estimado
                  </span>
                </th>
                <th className="p-3 text-center min-w-[130px]">Redução / Ganho</th>
                <th className="p-3 text-right min-w-[160px]">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredSteps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    <p className="text-sm font-bold text-slate-300">Nenhuma etapa encontrada com o filtro atual.</p>
                    <button
                      type="button"
                      onClick={() => { setStepFilter('all'); setStepSearch(''); }}
                      className="mt-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-400 font-mono cursor-pointer"
                    >
                      Limpar filtros de busca
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSteps.map(step => {
                const roleStyle = getRoleStyle(step.role);
                const kaizens = getStepKaizens(step);
                const hasKaizen = kaizens.length > 0;
                const isBottleneck = metrics.maxWaitStep?.id === step.id;

                const currentWtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
                
                // Determina o valor atual do WT futuro (se não definido, usa o WT atual como referência visual)
                const hasCustom = typeof step.futureWaitTime === 'number';
                const effectiveFutureWaitTime = hasCustom ? step.futureWaitTime! : step.waitTime;
                const effectiveFutureUnit = step.futureWaitTimeUnit || step.waitTimeUnit;
                const futureWtHours = convertTimeToHours(effectiveFutureWaitTime, effectiveFutureUnit, true);

                // Cálculo do Delta
                const diffHours = currentWtHours - futureWtHours;
                const diffPercent = currentWtHours > 0 ? Math.round((diffHours / currentWtHours) * 100) : 0;

                // Ações 5W2H vinculadas a esta etapa específica
                const stepActions = (kaizenRoadmap || []).filter(a => a.stepId === step.id);
                const isStep5W2HOpen = Boolean(expandedSteps5W2H[step.id]);

                return (
                  <React.Fragment key={step.id}>
                    <tr
                      className={`transition-colors hover:bg-slate-950/70 ${
                        isBottleneck ? 'bg-rose-950/10' : ''
                      } ${hasCustom ? 'bg-emerald-950/5' : ''} ${
                        isStep5W2HOpen ? 'bg-slate-950/90 border-t-2 border-amber-500/30' : ''
                      }`}
                    >
                      {/* 1. Ordem */}
                      <td className="p-3 text-center font-bold text-cyan-400">
                        #{step.order}
                      </td>

                      {/* 2. Título da Etapa */}
                      <td className="p-3 font-sans font-medium text-white max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="hover:text-cyan-300 cursor-pointer transition-colors"
                            onClick={() => onSelectStep?.(step.id)}
                          >
                            {step.title}
                          </span>
                          {step.isParallel && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono flex items-center gap-0.5">
                              <GitBranch className="w-2.5 h-2.5" />
                              Paralelo
                            </span>
                          )}
                          {isBottleneck && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 text-rose-400" />
                              Gargalo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Papel / Responsável */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border} whitespace-nowrap`}>
                          {step.role}
                        </span>
                      </td>

                      {/* 4. Oportunidades Kaizen Mapeadas (Referência da Etapa) */}
                      <td className="p-3 font-sans min-w-[260px]">
                        {kaizens.length > 0 ? (
                          <div className="space-y-1">
                            {kaizens.map((k, kIdx) => (
                              <div
                                key={kIdx}
                                className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed flex items-start gap-1.5"
                              >
                                <span className="shrink-0 text-amber-400 text-xs mt-0.5">💡</span>
                                <span className="break-words font-medium">{k}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Sem Kaizens mapeados</span>
                        )}
                      </td>

                      {/* 5. PT Atual */}
                      <td className="p-3 text-right text-cyan-300 font-bold whitespace-nowrap">
                        {step.processTime} {step.processTimeUnit}
                      </td>

                      {/* 6. WT Atual */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="font-bold text-amber-300 font-mono">
                          {step.waitTime} {step.waitTimeUnit}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ≈ {formatHoursCompact(currentWtHours)}
                        </div>
                      </td>

                      {/* 7. WT Futuro Estimado (INPUT INTERATIVO) */}
                      <td className="p-3 bg-emerald-950/25 border-x border-emerald-500/20">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={hasCustom ? step.futureWaitTime : ''}
                            placeholder={String(step.waitTime)}
                            onChange={e => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              onUpdateStep(step.id, {
                                futureWaitTime: val,
                                futureWaitTimeUnit: step.futureWaitTimeUnit || step.waitTimeUnit
                              });
                            }}
                            className={`w-20 px-2 py-1.5 rounded-lg text-xs font-bold font-mono border focus:outline-none focus:ring-1 transition-all ${
                              hasCustom
                                ? 'bg-emerald-950 border-emerald-400 text-emerald-200 focus:ring-emerald-400'
                                : 'bg-slate-950 border-slate-700 text-slate-400 focus:border-cyan-400 focus:ring-cyan-400'
                            }`}
                          />

                          <select
                            value={effectiveFutureUnit}
                            onChange={e => {
                              onUpdateStep(step.id, {
                                futureWaitTime: effectiveFutureWaitTime,
                                futureWaitTimeUnit: e.target.value as TimeUnit
                              });
                            }}
                            className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-400"
                          >
                            <option value="minutos">min</option>
                            <option value="horas">horas</option>
                            <option value="dias">dias</option>
                          </select>
                        </div>
                        <div className="text-[9px] font-mono text-emerald-400/80 mt-1 pl-1">
                          ≈ {formatHoursCompact(futureWtHours)} {hasCustom ? '(meta pactuada)' : '(base atual)'}
                        </div>
                      </td>

                      {/* 8. Redução / Ganho Estimado (Delta) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {hasCustom && diffHours > 0.01 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black font-mono">
                              -{diffPercent}%
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                              -{formatHoursCompact(diffHours)}
                            </span>
                          </div>
                        ) : hasCustom && diffHours < -0.01 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black font-mono">
                              +{Math.abs(diffPercent)}%
                            </span>
                            <span className="text-[10px] text-rose-400 font-mono mt-0.5">
                              +{formatHoursCompact(Math.abs(diffHours))}
                            </span>
                          </div>
                        ) : hasCustom ? (
                          <span className="text-[11px] text-slate-400 font-mono">
                            0% (Mantido)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            - (Sem meta)
                          </span>
                        )}
                      </td>

                      {/* 9. Ações Rápidas por Linha */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setStepReduction(step, 50)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Reduzir 50% do WT atual"
                          >
                            -50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setStepReduction(step, 75)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Reduzir 75% do WT atual"
                          >
                            -75%
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStep(step.id, {
                                futureWaitTime: 0,
                                futureWaitTimeUnit: step.waitTimeUnit
                              });
                            }}
                            className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Zerar o tempo de espera (Fluxo Contínuo / Fila Zero)"
                          >
                            Zerar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStep5W2H(step)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isStep5W2HOpen
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                                : stepActions.length > 0
                                ? 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-500/50 shadow-xs'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                            title={isStep5W2HOpen ? 'Recolher quadro 5W2H desta etapa' : 'Abrir/Preencher quadro 5W2H desta etapa'}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>5W2H</span>
                            {stepActions.length > 0 && (
                              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                isStep5W2HOpen ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/30 text-amber-200'
                              }`}>
                                {stepActions.length}
                              </span>
                            )}
                            {stepActions.some(a => !a.who || !a.who.trim()) && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Existe ação sem líder definido nesta etapa!" />
                            )}
                            {isStep5W2HOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Linha Expansível (Sub-row): Quadro 5W2H da Etapa (7 Informações) */}
                    {isStep5W2HOpen && (
                      <tr className="bg-slate-950/95 border-b-2 border-amber-500/40">
                        <td colSpan={9} className="p-4 sm:p-5 bg-gradient-to-b from-slate-950 to-slate-900/95 border-l-4 border-l-amber-500 shadow-inner">
                          <div className="space-y-4 font-sans">
                            {/* Cabeçalho Enxuto do Quadro 5W2H */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                                  #{step.order}
                                </span>
                                <h4 className="text-sm font-bold text-white font-heading">
                                  Quadro 5W2H • Etapa #{step.order}: {step.title}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                                  — Preencha as 7 informações da ação Kaizen para viabilizar o Estado Futuro
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddNewAction(step)}
                                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                  title="Adicionar outra ação 5W2H nesta etapa"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Outro 5W2H</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleStep5W2H(step)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors border border-slate-700 cursor-pointer flex items-center gap-1"
                                  title="Recolher quadro 5W2H desta etapa"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  <span>Recolher</span>
                                </button>
                              </div>
                            </div>

                            {/* Cards das Ações 5W2H (As 7 Informações) */}
                            {stepActions.length === 0 ? (
                              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-2">
                                <p className="text-xs text-slate-400 font-sans">
                                  Nenhum plano 5W2H cadastrado para a <strong>Etapa #{step.order} ({step.title})</strong>.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleAddNewAction(step)}
                                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Criar Plano 5W2H (7 Informações)</span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {stepActions.map((action, actionIdx) => {
                                  const diffDays = calculateDateDiffDays(action.startDate, action.endDate);

                                  return (
                                    <div
                                      key={action.id}
                                      className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-500/40 transition-all space-y-3.5 shadow-md"
                                    >
                                      {/* Barra Superior do Card: Identificação + Status + Excluir */}
                                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800 flex-wrap">
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                                            {stepActions.length > 1 ? `Ação 5W2H #${actionIdx + 1}` : 'Ação 5W2H'}
                                          </span>
                                          <span className="text-xs font-bold text-white font-sans truncate max-w-md">
                                            {action.what || 'Nova Ação Kaizen'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Status:</span>
                                            <select
                                              value={action.status || 'planejado'}
                                              onChange={e => handleUpdateAction(action.id, { status: e.target.value as any })}
                                              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                                            >
                                              <option value="planejado">Planejado</option>
                                              <option value="em_andamento">Em Andamento</option>
                                              <option value="concluido">Concluído</option>
                                            </select>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteAction(action.id)}
                                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Excluir este plano 5W2H"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* AS 7 INFORMAÇÕES DO 5W2H */}
                                      <div className="space-y-3 font-sans">
                                        {/* Linha 1: 1. O QUE (What) & 2. POR QUE (Why) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {/* 1. O QUE (What) */}
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-amber-300 flex items-center gap-1.5">
                                              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                                              <span>1. O QUE (What) — Ação Kaizen</span>
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={action.what}
                                              onChange={e => handleUpdateAction(action.id, { what: e.target.value })}
                                              placeholder="Descreva a ação pactuada no workshop (agrupando as oportunidades mapeadas)..."
                                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                                            />
                                          </div>

                                          {/* 2. POR QUE (Why) */}
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-emerald-300 flex items-center gap-1.5">
                                              <Target className="w-3.5 h-3.5 text-emerald-400" />
                                              <span>2. POR QUE (Why) — Justificativa / Meta</span>
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={action.why}
                                              onChange={e => handleUpdateAction(action.id, { why: e.target.value })}
                                              placeholder="Meta de redução do tempo de fila (WT) ou ganho de fluidez..."
                                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors resize-none leading-relaxed"
                                            />
                                          </div>
                                        </div>

                                        {/* Linha 2: 3. ONDE (Where), 4. QUEM (Who) & 5. QUANDO (When) */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                          {/* 3. ONDE (Where) */}
                                          <div className="md:col-span-3 space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                                              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                              <span>3. ONDE (Where)</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={action.where}
                                              onChange={e => handleUpdateAction(action.id, { where: e.target.value })}
                                              placeholder={`Etapa #${step.order} • ${step.title}`}
                                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                            />
                                          </div>

                                          {/* 4. QUEM (Who - Nome da Pessoa Física) */}
                                          <div className="md:col-span-4 space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-amber-300 flex items-center justify-between">
                                              <span className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-amber-400" />
                                                <span>4. QUEM (Who — Nome do Líder)</span>
                                              </span>
                                              {!action.who.trim() ? (
                                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono font-bold">
                                                  ⚠️ Definir Nome
                                                </span>
                                              ) : (
                                                <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                                                  <Check className="w-2.5 h-2.5" /> Ok
                                                </span>
                                              )}
                                            </label>
                                            <input
                                              type="text"
                                              value={action.who}
                                              onChange={e => handleUpdateAction(action.id, { who: e.target.value })}
                                              placeholder="Nome da pessoa física responsável..."
                                              className={`w-full rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                                !action.who.trim()
                                                  ? 'bg-rose-950/20 border-2 border-amber-500/80 text-amber-200 placeholder-amber-400/60 focus:border-amber-400'
                                                  : 'bg-slate-950 border border-slate-700 text-amber-200 focus:border-amber-400'
                                              }`}
                                            />
                                          </div>

                                          {/* 5. QUANDO (When - Data Inicial e Final) */}
                                          <div className="md:col-span-5 space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-cyan-300 flex items-center justify-between">
                                              <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                                <span>5. QUANDO (When — Prazos)</span>
                                              </span>
                                              {diffDays !== null && (
                                                <span className="text-[9px] font-mono text-cyan-400 font-bold">
                                                  {diffDays} dias de duração
                                                </span>
                                              )}
                                            </label>

                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Início:</span>
                                                <input
                                                  type="date"
                                                  value={action.startDate || ''}
                                                  onChange={e => handleUpdateAction(action.id, { startDate: e.target.value })}
                                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                                                />
                                              </div>
                                              <div>
                                                <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Término:</span>
                                                <input
                                                  type="date"
                                                  value={action.endDate || ''}
                                                  onChange={e => handleUpdateAction(action.id, { endDate: e.target.value })}
                                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                                                />
                                              </div>
                                            </div>

                                            {/* Atalhos Rápidos de Prazo */}
                                            <div className="flex items-center gap-1 pt-0.5">
                                              <span className="text-[9px] font-mono text-slate-500">Atalhos:</span>
                                              {[15, 30, 45, 60, 90].map(d => (
                                                <button
                                                  key={d}
                                                  type="button"
                                                  onClick={() => {
                                                    const base = action.startDate || getTodayISO();
                                                    handleUpdateAction(action.id, {
                                                      startDate: base,
                                                      endDate: addDaysISO(base, d)
                                                    });
                                                  }}
                                                  className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-cyan-950 hover:text-cyan-300 text-[9px] font-mono text-slate-400 border border-slate-800 cursor-pointer transition-colors"
                                                >
                                                  +{d}d
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Linha 3: 6. COMO (How) & 7. QUANTO CUSTA (How Much) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                                          {/* 6. COMO (How) */}
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                                              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                                              <span>6. COMO (How) — Método / Ferramenta</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={action.how || ''}
                                              onChange={e => handleUpdateAction(action.id, { how: e.target.value })}
                                              placeholder="Método, ferramenta ou procedimento (ex: POP padronizado, checklist, automação)..."
                                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                            />
                                          </div>

                                          {/* 7. QUANTO CUSTA (How Much) */}
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                                              <Percent className="w-3.5 h-3.5 text-emerald-400" />
                                              <span>7. QUANTO CUSTA (How Much) — Custo / Recursos</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={action.howMuch || ''}
                                              onChange={e => handleUpdateAction(action.id, { howMuch: e.target.value })}
                                              placeholder="Custo estimado ou esforço interno (ex: R$ 0 esforço interno)..."
                                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Botão para adicionar outra ação na etapa caso queiram */}
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAddNewAction(step)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Adicionar Outro Plano 5W2H Nesta Etapa</span>
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>

            {/* Rodapé Consolidado */}
            <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-mono text-xs font-bold text-white">
              <tr>
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-slate-400">
                  Totais Auditados do Fluxo:
                </td>
                <td className="p-3 text-right text-cyan-400">
                  {formatHours(futureMetrics.currentLeadTimeHours - futureMetrics.currentWaitHours)}
                </td>
                <td className="p-3 text-right text-amber-400">
                  {formatHours(futureMetrics.currentWaitHours)}
                </td>
                <td className="p-3 bg-emerald-950/30 border-x border-emerald-500/30 text-emerald-300 font-black">
                  {formatHours(futureMetrics.futureWaitHours)}
                </td>
                <td className="p-3 text-center text-emerald-400 font-black">
                  -{futureMetrics.waitReductionPercent}%
                </td>
                <td className="p-3 text-right text-[11px] text-slate-300 font-normal">
                  <div className="flex flex-col items-end gap-0.5 font-mono">
                    <span>Lead Time: {formatHours(futureMetrics.currentLeadTimeHours)} ➔ <strong className="text-emerald-300">{formatHours(futureMetrics.futureLeadTimeHours)}</strong></span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      {(kaizenRoadmap || []).length} ação(ões) 5W2H pactuadas
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
