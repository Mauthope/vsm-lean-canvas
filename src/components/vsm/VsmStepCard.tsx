'use client';

import React from 'react';
import {
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Copy,
  Pencil,
  Trash2,
  GitBranch,
  Flame,
  MessageSquare
} from 'lucide-react';
import { VSMStep, WasteType } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  WASTE_METAS,
  getRoleStyle,
  getStepKaizens
} from '@/lib/vsmCalculations';

interface VsmStepCardProps {
  step: VSMStep;
  index: number;
  totalSteps: number;
  isBottleneckWait?: boolean;
  isBottleneckAccuracy?: boolean;
  onEdit: (step: VSMStep) => void;
  onDelete: (stepId: string) => void;
  onDuplicate: (step: VSMStep) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onOpenKaizenNotes: (step: VSMStep) => void;
}

export const VsmStepCard: React.FC<VsmStepCardProps> = ({
  step,
  index,
  totalSteps,
  isBottleneckWait,
  isBottleneckAccuracy,
  onEdit,
  onDelete,
  onDuplicate,
  onMove,
  onOpenKaizenNotes
}) => {
  const roleStyle = getRoleStyle(step.role);

  const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
  const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);

  const hasFutureWt = typeof step.futureWaitTime === 'number';
  const futureWtHours = hasFutureWt
    ? convertTimeToHours(step.futureWaitTime!, step.futureWaitTimeUnit || step.waitTimeUnit, true)
    : wtHours;
  const wtDeltaPercent = wtHours > 0 && hasFutureWt ? Math.round(((wtHours - futureWtHours) / wtHours) * 100) : 0;

  const accuracy = typeof step.percentCompleteAndAccurate === 'number' ? step.percentCompleteAndAccurate : 100;
  const accuracyColor =
    accuracy >= 90
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : accuracy >= 75
      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  const kaizens = getStepKaizens(step);
  const hasKaizen = kaizens.length > 0;

  return (
    <div
      className={`relative w-80 shrink-0 rounded-2xl bg-slate-900/95 border transition-all duration-200 flex flex-col justify-between select-none ${
        isBottleneckWait
          ? 'border-rose-500/70 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
          : hasKaizen
          ? 'border-amber-500/40 shadow-md shadow-amber-950/20 hover:border-amber-500/60'
          : 'border-slate-800 shadow-xl hover:border-slate-700'
      }`}
    >
      {/* Top Accent Line for Parallel / Bottleneck */}
      {step.isParallel && (
        <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-purple-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-md shadow-purple-500/30">
          <GitBranch className="w-3 h-3" />
          <span>Etapa em Paralelo</span>
        </div>
      )}

      {isBottleneckWait && (
        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shadow-md shadow-rose-500/40 animate-pulse">
          <Flame className="w-3 h-3" />
          <span>Maior Gargalo de Fila</span>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Order & Role Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono font-black text-cyan-400 flex items-center justify-center">
              #{step.order}
            </span>
            <div className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
              <span className="truncate max-w-[120px]">{step.role || 'Sem Responsável'}</span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDuplicate(step)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Duplicar Etapa"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(step)}
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
              title="Editar Etapa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(step.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Excluir Etapa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Title */}
        <h3 className="text-sm font-bold text-white font-heading leading-tight line-clamp-2 min-h-[2.5rem]">
          {step.title || 'Etapa sem título'}
        </h3>

        {/* Step Description (if any) */}
        {step.description && (
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {step.description}
          </p>
        )}
      </div>

      {/* Metrics Row: PT, WT, %C&A */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-y border-slate-800/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Process Time (PT) */}
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>PT (Esforço)</span>
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-black font-mono text-white">
                {step.processTime}
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                {step.processTimeUnit}
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              ≈ {formatHours(ptHours)}
            </div>
          </div>

          {/* Wait Time (WT) */}
          <div className={`p-2 rounded-xl border ${
            isBottleneckWait
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>WT (Fila)</span>
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-black font-mono text-white">
                {step.waitTime}
              </span>
              <span className={`text-[10px] font-mono ${isBottleneckWait ? 'text-rose-300' : 'text-amber-300'}`}>
                {step.waitTimeUnit}
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              ≈ {formatHours(wtHours)}
            </div>
            {hasFutureWt && (
              <div className="mt-1 pt-1 border-t border-emerald-500/30 flex items-center justify-between text-[9px] font-mono text-emerald-300">
                <span className="flex items-center gap-0.5 font-bold">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Meta:</span>
                </span>
                <span className="font-bold">
                  {step.futureWaitTime} {step.futureWaitTimeUnit || step.waitTimeUnit}
                  {wtDeltaPercent > 0 ? ` (-${wtDeltaPercent}%)` : wtDeltaPercent < 0 ? ` (+${Math.abs(wtDeltaPercent)}%)` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* %C&A (Percent Complete and Accurate) */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>% Completo & Correto (%C&A):</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded font-black text-xs border ${accuracyColor}`}>
              {accuracy}%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1.5 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                accuracy >= 90
                  ? 'bg-emerald-400'
                  : accuracy >= 75
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Waste Chips */}
      <div className="p-3 pb-2">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Desperdícios (Muda):</span>
          <span className="text-[10px] text-slate-500 font-mono">
            {step.wasteTypes?.length || 0} apontados
          </span>
        </div>

        <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
          {step.wasteTypes && step.wasteTypes.length > 0 ? (
            step.wasteTypes.map(w => {
              const meta = WASTE_METAS[w];
              if (!meta) return null;
              return (
                <span
                  key={w}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${meta.badgeClass}`}
                  title={meta.description}
                >
                  {meta.shortLabel}
                </span>
              );
            })
          ) : (
            <span className="text-[10px] text-slate-500 italic">Sem desperdícios mapeados</span>
          )}
        </div>
      </div>

      {/* Kaizen Burst Sticker / Action */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <button
          type="button"
          onClick={() => onOpenKaizenNotes(step)}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
            hasKaizen
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-md shadow-amber-950/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${hasKaizen ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="truncate">
              {hasKaizen
                ? kaizens.length === 1
                  ? '1 Kaizen Registrado'
                  : `${kaizens.length} Kaizens Registrados`
                : '+ Adicionar Kaizen'}
            </span>
          </div>
          {hasKaizen ? (
            <span className="min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
              {kaizens.length}
            </span>
          ) : (
            <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
          )}
        </button>

        {/* Kaizen Snippet Preview (if exists) */}
        {hasKaizen && (
          <div className="mt-1 space-y-1">
            {kaizens.slice(0, 2).map((k, kIdx) => (
              <p
                key={kIdx}
                className="text-[10px] text-amber-200/90 font-mono italic line-clamp-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
              >
                💡 "{k}"
              </p>
            ))}
            {kaizens.length > 2 && (
              <span className="text-[9px] text-amber-400/80 font-mono block pl-1">
                +{kaizens.length - 2} outro(s) kaizen(s)...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Reorder Controls */}
      <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-950/70 rounded-b-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            title="Mover para esquerda"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalSteps - 1}
            onClick={() => onMove(index, index + 1)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            title="Mover para direita"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
        >
          Editar Detalhes →
        </button>
      </div>

    </div>
  );
};
