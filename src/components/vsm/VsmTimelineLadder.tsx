'use client';

import React from 'react';
import {
  Clock,
  Zap,
  TrendingDown,
  Layers,
  ArrowRight,
  Info,
  GitBranch
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  formatHoursCompact
} from '@/lib/vsmCalculations';

interface VsmTimelineLadderProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onSelectStep?: (stepId: string) => void;
}

export const VsmTimelineLadder: React.FC<VsmTimelineLadderProps> = ({
  steps,
  metrics,
  onSelectStep
}) => {
  const { totalLeadTimeHours, totalProcessHours, totalWaitHours, flowEfficiency } = metrics;

  if (steps.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-wider text-cyan-400 font-mono">
              Régua de Dente de Serra (VSM Timeline Ladder)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              Padrão Lean Clássico
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            O degrau superior mapeia o tempo de espera (desperdício puro). O dente inferior mapeia o tempo de esforço real (valor agregado).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400/80 border border-amber-500" />
            <span className="text-slate-300">Fila / Espera (WT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-400/80 border border-cyan-500" />
            <span className="text-slate-300">Esforço Real (PT)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Ladder Chart */}
      <div className="overflow-x-auto custom-scrollbar pt-4 pb-2">
        <div className="min-w-[900px] flex flex-col gap-1">
          
          {/* Step Columns */}
          <div className="flex items-stretch gap-2">
            {steps.map((step, idx) => {
              const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
              const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
              const stepTotal = ptHours + wtHours;
              const isBottleneck = metrics.maxWaitStep?.id === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => onSelectStep?.(step.id)}
                  className={`flex-1 min-w-[140px] flex flex-col rounded-xl p-2.5 transition-all cursor-pointer group ${
                    isBottleneck
                      ? 'bg-rose-950/20 border border-rose-500/50 hover:border-rose-400'
                      : 'bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-cyan-300 transition-colors truncate">
                      #{step.order} {step.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {step.isParallel && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono flex items-center gap-0.5" title="Etapa Paralela / Concorrente (Caminho Crítico)">
                          <GitBranch className="w-2.5 h-2.5" />
                          Paralelo
                        </span>
                      )}
                      {isBottleneck && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Gargalo Crítico de Espera" />
                      )}
                    </div>
                  </div>

                  {/* Top Level: Wait Time (Crest / Degrau Superior) */}
                  <div className="relative pt-1 pb-2">
                    <div className="text-[9px] uppercase font-mono font-bold text-amber-400 flex items-center justify-between mb-1">
                      <span>WT (Fila):</span>
                      <span className="text-white font-mono font-black">{formatHoursCompact(wtHours)}</span>
                    </div>
                    {/* Wait Bar */}
                    <div className="w-full bg-slate-900 rounded-md h-7 p-1 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-amber-300 truncate">
                        {step.waitTime} {step.waitTimeUnit}
                      </span>
                    </div>
                  </div>

                  {/* Stepped Transition Arrow / Notch */}
                  <div className="flex items-center justify-center my-0.5">
                    <div className="w-0.5 h-3 bg-slate-700 group-hover:bg-cyan-500/60 transition-colors" />
                  </div>

                  {/* Bottom Level: Process Time (Trough / Dente Inferior) */}
                  <div className="relative pt-1">
                    <div className="text-[9px] uppercase font-mono font-bold text-cyan-400 flex items-center justify-between mb-1">
                      <span>PT (Trabalho):</span>
                      <span className="text-white font-mono font-black">{formatHoursCompact(ptHours)}</span>
                    </div>
                    {/* Process Bar */}
                    <div className="w-full bg-slate-900 rounded-md h-7 p-1 border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 truncate">
                        {step.processTime} {step.processTimeUnit}
                      </span>
                    </div>
                  </div>

                  {/* Step Flow Efficiency Pill */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Eficiência:</span>
                    <span className={`font-bold ${
                      stepTotal > 0 && (ptHours / stepTotal) >= 0.15
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {stepTotal > 0 ? ((ptHours / stepTotal) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Total VSM Ladder Summary Box */}
            <div className="w-48 shrink-0 rounded-xl p-3 bg-slate-950 border border-slate-800 flex flex-col justify-between shadow-inner">
              <div className="border-b border-slate-800 pb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                  Consolidação Lean
                </span>
                {Boolean(metrics.parallelStagesCount && metrics.parallelStagesCount > 0) && (
                  <span className="text-[9px] text-purple-400 font-mono flex items-center gap-1 mt-0.5" title="Etapas concorrentes regidas pelo Caminho Crítico (maior tempo)">
                    <GitBranch className="w-2.5 h-2.5 shrink-0" />
                    Caminho Crítico ({metrics.parallelStagesCount} paralelo)
                  </span>
                )}
              </div>

              {/* Total WT */}
              <div className="my-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <span className="text-[9px] uppercase font-bold text-amber-400 block font-mono">
                  Tempo em Fila (WT)
                </span>
                <span className="text-base font-black font-mono text-amber-300">
                  {formatHours(totalWaitHours)}
                </span>
              </div>

              {/* Total PT */}
              <div className="my-1 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                <span className="text-[9px] uppercase font-bold text-cyan-400 block font-mono">
                  Tempo de Esforço (PT)
                </span>
                <span className="text-base font-black font-mono text-cyan-300">
                  {formatHours(totalProcessHours)}
                </span>
              </div>

              {/* Final Flow Ratio */}
              <div className="pt-2 border-t border-slate-800 mt-2 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Eficiência Geral:</span>
                <span className={`font-black ${flowEfficiency >= 15 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {flowEfficiency.toFixed(1)}%
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
