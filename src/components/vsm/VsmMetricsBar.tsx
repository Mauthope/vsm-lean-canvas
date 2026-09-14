'use client';

import React from 'react';
import {
  Clock,
  Zap,
  Percent,
  AlertTriangle,
  Flame,
  Layers,
  ArrowRight,
  TrendingDown,
  HelpCircle,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { BottleneckAnalysis, VSMStep } from '@/types/vsm';
import {
  formatHours,
  getFlowEfficiencyClassification,
  convertTimeToHours,
  HOURS_PER_WORK_DAY
} from '@/lib/vsmCalculations';

interface VsmMetricsBarProps {
  metrics: BottleneckAnalysis;
  steps: VSMStep[];
  onSelectStep?: (stepId: string) => void;
  onOpenGlossary?: (topic?: string) => void;
  onOpenAiDiagnostic?: () => void;
}

export const VsmMetricsBar: React.FC<VsmMetricsBarProps> = ({
  metrics,
  steps,
  onSelectStep,
  onOpenGlossary,
  onOpenAiDiagnostic
}) => {
  const {
    totalLeadTimeHours,
    totalProcessHours,
    totalWaitHours,
    flowEfficiency,
    overallYield,
    maxWaitStep,
    lowestAccuracyStep
  } = metrics;

  const efficiencyMeta = getFlowEfficiencyClassification(flowEfficiency);

  // Calcula dias úteis (8h48min = 8.8h)
  const leadTimeDays = (totalLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1);
  const waitDays = (totalWaitHours / HOURS_PER_WORK_DAY).toFixed(1);
  const processDays = (totalProcessHours / HOURS_PER_WORK_DAY).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      
      {/* 1. LEAD TIME TOTAL (LT) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between group hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Lead Time Total (LT)
              </span>
              <button
                type="button"
                onClick={() => onOpenGlossary?.('lt')}
                className="text-slate-500 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                title="O que é Lead Time? Clique para aprender."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-amber-400 font-semibold font-mono">
              Tempo de ponta a ponta
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('lt')}
            className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
            title="Aprender sobre Lead Time"
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {totalLeadTimeHours < 1 ? Math.round(totalLeadTimeHours * 60) : totalLeadTimeHours.toFixed(1)}
            </span>
            <span className="text-xs font-bold font-mono text-slate-400">
              {totalLeadTimeHours < 1 ? 'minutos' : 'horas'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/70">
            <span>Fila/Espera (WT):</span>
            <span className="text-amber-300 font-semibold">{totalWaitHours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400" title="1 dia útil = 8h48min (8.8 horas)">Dias Úteis (8h48m):</span>
          <span className="font-mono font-bold text-amber-300">~{leadTimeDays} dias</span>
        </div>

        {Boolean(metrics.parallelStagesCount && metrics.parallelStagesCount > 0) && (
          <div className="mt-1 text-[10px] text-purple-400 font-mono flex items-center justify-end gap-1" title="Etapas concorrentes calculadas pelo maior tempo (Caminho Crítico Lean Office)">
            <GitBranch className="w-2.5 h-2.5" />
            <span>Caminho Crítico ({metrics.parallelStagesCount} paralelo)</span>
          </div>
        )}
      </div>

      {/* 2. TEMPO DE PROCESSO (PT) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Tempo de Esforço (PT)
              </span>
              <button
                type="button"
                onClick={() => onOpenGlossary?.('pt')}
                className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5 cursor-pointer"
                title="O que é Process Time (PT)? Clique para aprender."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-cyan-400/90 font-semibold font-mono">
              Valor Agregado Real
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('pt')}
            className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
            title="Aprender sobre Process Time"
          >
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-cyan-400">
              {totalProcessHours < 1 ? Math.round(totalProcessHours * 60) : totalProcessHours.toFixed(1)}
            </span>
            <span className="text-xs font-bold font-mono text-cyan-300">
              {totalProcessHours < 1 ? 'minutos' : 'horas'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/70">
            <span>Etapas Mapeadas:</span>
            <span className="text-cyan-300 font-semibold">{steps.length} etapas</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Esforço Líquido:</span>
          <span className="font-mono font-bold text-cyan-300">~{processDays}d úteis</span>
        </div>
      </div>

      {/* 3. EFICIÊNCIA DE FLUXO (FE) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 block font-mono">
                Eficiência de Fluxo
              </span>
              <button
                type="button"
                onClick={() => onOpenGlossary?.('fe')}
                className="text-slate-500 hover:text-emerald-400 transition-colors p-0.5 cursor-pointer"
                title="O que é Eficiência de Fluxo? Clique para ver fórmula."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              PT ÷ LT × 100%
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('fe')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              flowEfficiency >= 15
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                : flowEfficiency >= 5
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Aprender sobre Eficiência de Fluxo"
          >
            <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              flowEfficiency >= 15
                ? 'text-emerald-400'
                : flowEfficiency >= 5
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {flowEfficiency.toFixed(1)}%
            </span>
          </div>

          {/* Mini gauge bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 mt-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                flowEfficiency >= 15
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                  : flowEfficiency >= 5
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-rose-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(3, flowEfficiency))}%` }}
            />
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 truncate">Status:</span>
          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${efficiencyMeta.badgeClass}`}>
            {flowEfficiency < 5 ? 'Crítico (<5%)' : flowEfficiency < 15 ? 'Típico Adm' : 'Excelente'}
          </span>
        </div>
      </div>

      {/* 4. ROLLED FIRST PASS YIELD (RFPY / %C&A) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-purple-300 block font-mono">
                Rolled Yield (RFPY)
              </span>
              <button
                type="button"
                onClick={() => onOpenGlossary?.('ca')}
                className="text-purple-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                title="O que é %C&A e RFPY? Clique para aprender."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-purple-400 font-semibold font-mono">
              Efeito Cascata %C&A
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('ca')}
            className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
            title="Aprender sobre %C&A e Rolled Yield"
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              overallYield >= 80
                ? 'text-emerald-400'
                : overallYield >= 50
                ? 'text-purple-300'
                : 'text-rose-400'
            }`}>
              {overallYield.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">
              sem retrabalho
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/70">
            <span>Perda Acumulada:</span>
            <span className="text-rose-400 font-semibold">{(100 - overallYield).toFixed(1)}%</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 truncate">Rendimento Global:</span>
          <span className="font-mono font-bold text-purple-300">
            {overallYield < 50 ? 'Alto Retrabalho' : overallYield < 80 ? 'Moderado' : 'Consistente'}
          </span>
        </div>
      </div>

      {/* 5. GARGALO CRÍTICO DO FLUXO */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-rose-500/30 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-rose-400 block font-mono">
                Gargalo Crítico
              </span>
              <button
                type="button"
                onClick={() => onOpenGlossary?.('bottleneck')}
                className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                title="O que é o Gargalo no Lean? Teoria das Restrições."
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              Maior Fila / Espera (WT)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenGlossary?.('bottleneck')}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
            title="Aprender sobre Teoria das Restrições / Gargalo"
          >
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="mt-2.5">
          {maxWaitStep ? (
            <div>
              <button
                type="button"
                onClick={() => onSelectStep?.(maxWaitStep.id)}
                className="text-left w-full group/btn"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover/btn:text-cyan-300 transition-colors truncate">
                  <span className="text-rose-400 font-mono">#{maxWaitStep.order}</span>
                  <span className="truncate">{maxWaitStep.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                  <span className="text-amber-400 font-semibold">
                    WT: {formatHours(convertTimeToHours(maxWaitStep.waitTime, maxWaitStep.waitTimeUnit, true))}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 truncate">{maxWaitStep.role}</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">Nenhuma etapa cadastrada</div>
          )}

          {lowestAccuracyStep && lowestAccuracyStep.percentCompleteAndAccurate < 80 && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/70">
              <span className="text-purple-400 truncate">Gargalo %C&A:</span>
              <span className="text-purple-300 font-bold shrink-0">
                #{lowestAccuracyStep.order} ({lowestAccuracyStep.percentCompleteAndAccurate}%)
              </span>
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Alvo Kaizen:</span>
          {onOpenAiDiagnostic ? (
            <button
              type="button"
              onClick={onOpenAiDiagnostic}
              className="font-mono font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Executar Diagnóstico Executivo com Inteligência Artificial"
            >
              <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
              <span>Diagnosticar com IA</span>
            </button>
          ) : (
            <span className="font-mono font-bold text-rose-400">
              {maxWaitStep ? 'Reduzir Espera' : 'Mapear Etapas'}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
