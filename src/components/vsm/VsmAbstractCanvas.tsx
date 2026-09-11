'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  Sparkles,
  GitBranch,
  ArrowRight,
  Eye,
  Layers,
  Filter,
  Maximize2,
  Info,
  Pencil
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis, WasteType } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  formatHoursCompact,
  getRoleStyle,
  WASTE_METAS
} from '@/lib/vsmCalculations';

interface VsmAbstractCanvasProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onEditStep: (step: VSMStep) => void;
  onOpenKaizenNotes: (step: VSMStep) => void;
}

type HeatmapMode = 'bottlenecks' | 'accuracy' | 'roles';

export const VsmAbstractCanvas: React.FC<VsmAbstractCanvasProps> = ({
  steps,
  metrics,
  onEditStep,
  onOpenKaizenNotes
}) => {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('bottlenecks');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selectedStep = useMemo(
    () => steps.find(s => s.id === selectedStepId) || null,
    [steps, selectedStepId]
  );

  if (steps.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400">
        Nenhuma etapa no fluxo para visualização abstrata.
      </div>
    );
  }

  // Find max values for proportional color scales
  const maxWaitHours = useMemo(() => {
    return Math.max(
      ...steps.map(s => convertTimeToHours(s.waitTime, s.waitTimeUnit, true)),
      1
    );
  }, [steps]);

  return (
    <div className="rounded-3xl bg-[#050811] border border-slate-800/90 shadow-2xl overflow-hidden relative">
      
      {/* Top Controls Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <h2 className="text-base font-bold text-white font-heading">
              Mapa Abstrato do Fluxo (Visão Panorâmica de Gargalos)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
              Big Picture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão holística que cabe na tela. Os nós com halos brilhantes e alertas vermelhos indicam onde o processo está travado.
          </p>
        </div>

        {/* Heatmap Mode Selector & Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">Coloração:</span>
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setHeatmapMode('bottlenecks')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                heatmapMode === 'bottlenecks'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Gargalos de Espera</span>
            </button>
            <button
              type="button"
              onClick={() => setHeatmapMode('accuracy')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                heatmapMode === 'accuracy'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Qualidade (%C&A)</span>
            </button>
            <button
              type="button"
              onClick={() => setHeatmapMode('roles')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                heatmapMode === 'roles'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Setor/Papel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Abstract Flow Grid / Pipeline Area */}
      <div className="p-6 sm:p-8 min-h-[420px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex flex-col justify-center">
        
        {/* Abstract Topology Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10 gap-x-6 relative">
          {steps.map((step, idx) => {
            const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
            const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
            const stepTotal = ptHours + wtHours;
            const isWaitBottleneck = metrics.maxWaitStep?.id === step.id;
            const isAccuracyBottleneck = metrics.lowestAccuracyStep?.id === step.id;
            const hasKaizen = Boolean(step.kaizenNotes && step.kaizenNotes.trim().length > 0);
            const roleStyle = getRoleStyle(step.role);

            // Wait intensity ratio (0 to 1)
            const waitRatio = maxWaitHours > 0 ? wtHours / maxWaitHours : 0;

            // Compute dynamic color styling based on active heatmap mode
            let nodeBorder = 'border-slate-800';
            let nodeBg = 'bg-slate-900/90';
            let nodeGlow = '';

            if (heatmapMode === 'bottlenecks') {
              if (isWaitBottleneck) {
                nodeBorder = 'border-rose-500';
                nodeBg = 'bg-rose-950/40';
                nodeGlow = 'ring-2 ring-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)]';
              } else if (waitRatio > 0.6) {
                nodeBorder = 'border-amber-500/70';
                nodeBg = 'bg-amber-950/25';
                nodeGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.25)]';
              } else {
                nodeBorder = 'border-slate-800 hover:border-slate-700';
                nodeBg = 'bg-slate-900/80';
              }
            } else if (heatmapMode === 'accuracy') {
              const acc = typeof step.percentCompleteAndAccurate === 'number' ? step.percentCompleteAndAccurate : 100;
              if (acc < 75) {
                nodeBorder = 'border-rose-500';
                nodeBg = 'bg-rose-950/30';
                nodeGlow = 'ring-2 ring-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]';
              } else if (acc < 90) {
                nodeBorder = 'border-amber-500/60';
                nodeBg = 'bg-amber-950/20';
              } else {
                nodeBorder = 'border-emerald-500/50';
                nodeBg = 'bg-emerald-950/20';
              }
            } else if (heatmapMode === 'roles') {
              nodeBorder = roleStyle.border;
              nodeBg = roleStyle.bg;
            }

            const isSelected = selectedStepId === step.id;

            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
                className={`relative group rounded-2xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${nodeBorder} ${nodeBg} ${nodeGlow} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.03] z-20 shadow-2xl' : 'hover:scale-[1.02]'
                }`}
              >
                {/* Critical Bottleneck Beacon Tag */}
                {isWaitBottleneck && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-rose-950/60 animate-bounce">
                    <Flame className="w-3 h-3" />
                    <span>Maior Gargalo</span>
                  </div>
                )}

                {isAccuracyBottleneck && !isWaitBottleneck && step.percentCompleteAndAccurate < 80 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-950/60">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Gargalo %C&A</span>
                  </div>
                )}

                {/* Node Top: Order Number & Role Avatar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-black text-cyan-400 flex items-center justify-center shadow-inner">
                      #{step.order}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border truncate max-w-[100px] ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                      {step.role}
                    </span>
                  </div>

                  {/* Kaizen Burst Sticker */}
                  {hasKaizen && (
                    <div
                      className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-400/30 animate-pulse"
                      title={`Kaizen: ${step.kaizenNotes}`}
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Node Title */}
                <div className="my-1 min-h-[2.5rem]">
                  <h4 className="text-xs font-bold text-white font-heading line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                    {step.title}
                  </h4>
                </div>

                {/* Abstract Visual Time Gauge (Dual proportional bar) */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />
                      <span>{step.processTime}{step.processTimeUnit.slice(0, 1)}</span>
                    </span>
                    <span className={`flex items-center gap-0.5 font-bold ${isWaitBottleneck ? 'text-rose-400 font-black' : 'text-amber-400'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{step.waitTime}{step.waitTimeUnit.slice(0, 1)}</span>
                    </span>
                  </div>

                  {/* Proportional PT vs WT Split Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
                    <div
                      style={{ width: `${Math.max(5, stepTotal > 0 ? (ptHours / stepTotal) * 100 : 50)}%` }}
                      className="h-full bg-cyan-400 transition-all"
                      title={`Esforço: ${formatHours(ptHours)}`}
                    />
                    <div
                      style={{ width: `${Math.max(5, stepTotal > 0 ? (wtHours / stepTotal) * 100 : 50)}%` }}
                      className={`h-full transition-all ${isWaitBottleneck ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
                      title={`Fila: ${formatHours(wtHours)}`}
                    />
                  </div>

                  {/* Flow Efficiency & Accuracy Footer */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>Eficiência: <strong className="text-slate-200">{stepTotal > 0 ? ((ptHours / stepTotal) * 100).toFixed(0) : 0}%</strong></span>
                    <span>C&A: <strong className={step.percentCompleteAndAccurate >= 90 ? 'text-emerald-400' : 'text-amber-400'}>{step.percentCompleteAndAccurate}%</strong></span>
                  </div>
                </div>

                {/* Parallel Step Notch */}
                {step.isParallel && (
                  <div className="mt-2 text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    <span>Em Paralelo</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Slide-over Detail Inspector Drawer (When a node is selected) */}
      {selectedStep && (
        <div className="p-5 bg-slate-950/95 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-xs font-mono font-black">
                #{selectedStep.order}
              </span>
              <h3 className="text-sm font-bold text-white font-heading">
                {selectedStep.title}
              </h3>
              <span className="text-xs text-slate-400">
                • {selectedStep.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {selectedStep.description || 'Sem descrição cadastrada para esta etapa.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">PT: </span>
              <strong className="text-cyan-400">{selectedStep.processTime} {selectedStep.processTimeUnit}</strong>
              <span className="text-slate-600 mx-1.5">|</span>
              <span className="text-slate-400">WT: </span>
              <strong className="text-amber-400">{selectedStep.waitTime} {selectedStep.waitTimeUnit}</strong>
              <span className="text-slate-600 mx-1.5">|</span>
              <span className="text-slate-400">%C&A: </span>
              <strong className="text-emerald-400">{selectedStep.percentCompleteAndAccurate}%</strong>
            </div>

            <button
              type="button"
              onClick={() => onEditStep(selectedStep)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Etapa</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStepId(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Bottom Legend Strip */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/50 animate-pulse" />
            <span className="text-rose-300 font-bold">Gargalo Crítico de Espera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Esforço (PT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Fila (WT)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Dica: Clique em qualquer etapa para inspecionar os tempos e oportunidades Kaizen.
        </span>
      </div>

    </div>
  );
};
