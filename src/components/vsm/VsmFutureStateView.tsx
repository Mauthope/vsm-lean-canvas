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
  ChevronRight
} from 'lucide-react';
import { VSMStep, TimeUnit, BottleneckAnalysis, FutureStateMetrics } from '@/types/vsm';
import {
  formatHours,
  formatHoursCompact,
  convertTimeToHours,
  HOURS_PER_WORK_DAY,
  getRoleStyle,
  getStepKaizens,
  calculateFutureStateMetrics
} from '@/lib/vsmCalculations';

interface VsmFutureStateViewProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onUpdateStep: (stepId: string, updates: Partial<VSMStep>) => void;
  onOpenReportModal: () => void;
  onOpenGlossary?: (topic?: string) => void;
  onSelectStep?: (stepId: string) => void;
}

export const VsmFutureStateView: React.FC<VsmFutureStateViewProps> = ({
  steps,
  metrics,
  onUpdateStep,
  onOpenReportModal,
  onOpenGlossary,
  onSelectStep
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
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Eficiência de Fluxo (FE)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  {futureMetrics.futureFlowEfficiency.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  (+{(futureMetrics.futureFlowEfficiency - futureMetrics.currentFlowEfficiency).toFixed(1)} pp)
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/70 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>De: <strong className="text-slate-200">{futureMetrics.currentFlowEfficiency.toFixed(1)}%</strong></span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
              <span>Para: <strong className="text-cyan-300">{futureMetrics.futureFlowEfficiency.toFixed(1)}%</strong></span>
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <span>Matriz Auditável do Fluxo de Valor • Estado Futuro</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                {steps.length} etapas
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite o <strong>WT Futuro Estimado</strong> diretamente na coluna verde. Veja a redução e o impacto recalculados na hora.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3 min-w-[180px]">Título da Etapa</th>
                <th className="p-3 whitespace-nowrap">Responsável</th>
                <th className="p-3 min-w-[280px] text-amber-400 font-bold">Oportunidades Kaizen (Justificativa)</th>
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
              {steps.map(step => {
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

                return (
                  <tr
                    key={step.id}
                    className={`transition-colors hover:bg-slate-950/70 ${
                      isBottleneck ? 'bg-rose-950/10' : ''
                    } ${hasCustom ? 'bg-emerald-950/5' : ''}`}
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

                    {/* 4. Oportunidades Kaizen Associadas */}
                    <td className="p-3 font-sans min-w-[280px]">
                      {kaizens.length > 0 ? (
                        <div className="space-y-1.5">
                          {kaizens.map((k, kIdx) => (
                            <div
                              key={kIdx}
                              className="p-2 rounded-lg bg-amber-950/25 border border-amber-500/25 text-amber-200 text-xs leading-relaxed flex items-start gap-2 shadow-xs"
                            >
                              <span className="shrink-0 text-amber-400 text-xs mt-0.5">💡</span>
                              <span className="break-words font-normal flex-1">{k}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Sem Kaizens registrados</span>
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
                      </div>
                    </td>

                  </tr>
                );
              })}
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
                <td className="p-3 text-right text-[11px] text-slate-400 font-normal">
                  Lead Time: {formatHours(futureMetrics.currentLeadTimeHours)} ➔ <strong className="text-emerald-300">{formatHours(futureMetrics.futureLeadTimeHours)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
