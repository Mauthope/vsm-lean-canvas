'use client';

import React, { useRef } from 'react';
import {
  Plus,
  ArrowRight,
  Clock,
  Zap,
  GitBranch,
  Flame,
  MousePointerClick
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import { VsmStepCard } from './VsmStepCard';
import { formatHours, convertTimeToHours } from '@/lib/vsmCalculations';

interface VsmCanvasProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onEditStep: (step: VSMStep) => void;
  onDeleteStep: (stepId: string) => void;
  onDuplicateStep: (step: VSMStep) => void;
  onMoveStep: (fromIndex: number, toIndex: number) => void;
  onInsertStepAtIndex: (index: number) => void;
  onOpenKaizenNotes: (step: VSMStep) => void;
}

export const VsmCanvas: React.FC<VsmCanvasProps> = ({
  steps,
  metrics,
  onEditStep,
  onDeleteStep,
  onDuplicateStep,
  onMoveStep,
  onInsertStepAtIndex,
  onOpenKaizenNotes
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full rounded-2xl bg-[#060a13] border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Canvas Top Bar: Status and Quick Guide */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-slate-300">
            Canvas do Fluxo de Valor ({steps.length} etapas)
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            Clique no botão <strong className="text-cyan-300">+</strong> entre as etapas para inserir uma nova durante a dinâmica ao vivo.
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
          <span className="hidden md:inline">Role horizontalmente para navegar</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] text-rose-300">Gargalo</span>
          </div>
        </div>
      </div>

      {/* Main Scrollable Canvas Area */}
      <div
        ref={containerRef}
        className="p-6 overflow-x-auto custom-scrollbar min-h-[480px] flex items-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {steps.length === 0 ? (
          <div className="mx-auto text-center py-12 px-6 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              Canvas de VSM Vazio
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Inicie adicionando a primeira etapa da dinâmica com a equipe ou carregue um dos templates de RH e processos administrativos no menu superior.
            </p>
            <button
              type="button"
              onClick={() => onInsertStepAtIndex(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Primeira Etapa</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4">
            
            {/* Step Sequence with Connectors */}
            {steps.map((step, idx) => {
              const isBottleneckWait = metrics.maxWaitStep?.id === step.id;
              const isBottleneckAccuracy = metrics.lowestAccuracyStep?.id === step.id;
              const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

              return (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <VsmStepCard
                    step={step}
                    index={idx}
                    totalSteps={steps.length}
                    isBottleneckWait={isBottleneckWait}
                    isBottleneckAccuracy={isBottleneckAccuracy}
                    onEdit={onEditStep}
                    onDelete={onDeleteStep}
                    onDuplicate={onDuplicateStep}
                    onMove={onMoveStep}
                    onOpenKaizenNotes={onOpenKaizenNotes}
                  />

                  {/* Flow Connector Arrow & Insert Button Between Steps */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-20 px-1 relative group/conn">
                    
                    {/* Wait Time Indicator Pill on Connector */}
                    <div className="mb-1 text-center">
                      <span className="text-[9px] font-mono font-bold text-amber-400/90 block truncate" title={`Tempo de Fila: ${step.waitTime} ${step.waitTimeUnit}`}>
                        {step.waitTime} {step.waitTimeUnit.slice(0, 3)}
                      </span>
                    </div>

                    {/* Horizontal Connector Line */}
                    <div className="relative w-full flex items-center justify-center">
                      <div className="w-full h-0.5 bg-slate-800 group-hover/conn:bg-cyan-500/60 transition-colors" />
                      
                      {/* Interactive Inserter Button (+) */}
                      <button
                        type="button"
                        onClick={() => onInsertStepAtIndex(idx + 1)}
                        className="absolute w-6 h-6 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 flex items-center justify-center shadow-lg transition-all group-hover/conn:scale-110 cursor-pointer hover:bg-slate-850"
                        title="Inserir nova etapa aqui"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <ArrowRight className="absolute -right-1 w-3.5 h-3.5 text-slate-700 group-hover/conn:text-cyan-400 transition-colors" />
                    </div>

                    {/* Step Transition Label */}
                    <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase tracking-tighter">
                      Handoff
                    </span>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Quick Add Step at the End of Chain */}
            <button
              type="button"
              onClick={() => onInsertStepAtIndex(steps.length)}
              className="w-48 h-64 shrink-0 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-300 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/30 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-cyan-300" />
              </div>
              <span className="text-xs font-bold font-mono">
                + Nova Etapa
              </span>
              <span className="text-[10px] text-slate-400 text-center px-4 leading-tight">
                Adicionar etapa final ao fluxo
              </span>
            </button>

          </div>
        )}
      </div>

    </div>
  );
};
