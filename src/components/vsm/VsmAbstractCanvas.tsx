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
  Info,
  Pencil,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Compass
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  getRoleStyle
} from '@/lib/vsmCalculations';

interface VsmAbstractCanvasProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onEditStep: (step: VSMStep) => void;
  onOpenKaizenNotes: (step: VSMStep) => void;
  onOpenGlossary?: (topic?: string) => void;
}

type HeatmapMode = 'bottlenecks' | 'accuracy' | 'roles';

type FlowBlock =
  | { type: 'single'; step: VSMStep; index: number }
  | { type: 'parallel'; steps: VSMStep[]; startIndex: number };

export const VsmAbstractCanvas: React.FC<VsmAbstractCanvasProps> = ({
  steps,
  metrics,
  onEditStep,
  onOpenKaizenNotes,
  onOpenGlossary
}) => {
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('bottlenecks');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showCaExplainer, setShowCaExplainer] = useState(true);

  const selectedStep = useMemo(
    () => steps.find(s => s.id === selectedStepId) || null,
    [steps, selectedStepId]
  );

  // Group steps into sequential single steps or parallel blocks
  const flowBlocks = useMemo(() => {
    const blocks: FlowBlock[] = [];
    let currentParallel: VSMStep[] = [];
    let parallelStartIndex = 0;

    steps.forEach((step, idx) => {
      if (step.isParallel) {
        if (currentParallel.length === 0) {
          parallelStartIndex = idx;
        }
        currentParallel.push(step);
      } else {
        if (currentParallel.length > 0) {
          blocks.push({
            type: 'parallel',
            steps: currentParallel,
            startIndex: parallelStartIndex
          });
          currentParallel = [];
        }
        blocks.push({
          type: 'single',
          step,
          index: idx
        });
      }
    });

    if (currentParallel.length > 0) {
      blocks.push({
        type: 'parallel',
        steps: currentParallel,
        startIndex: parallelStartIndex
      });
    }

    return blocks;
  }, [steps]);

  // Max wait time for relative scaling
  const maxWaitHours = useMemo(() => {
    return Math.max(
      ...steps.map(s => convertTimeToHours(s.waitTime, s.waitTimeUnit, true)),
      1
    );
  }, [steps]);

  if (steps.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-mono">
        Nenhuma etapa no fluxo para visualização abstrata.
      </div>
    );
  }

  // Render individual Step Card
  const renderStepNode = (step: VSMStep, inParallelLane = false) => {
    const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
    const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
    const stepTotal = ptHours + wtHours;
    const isWaitBottleneck = metrics.maxWaitStep?.id === step.id;
    const isAccuracyBottleneck = metrics.lowestAccuracyStep?.id === step.id;
    const hasKaizen = Boolean(step.kaizenNotes && step.kaizenNotes.trim().length > 0);
    const roleStyle = getRoleStyle(step.role);

    // Color heatmap logic
    let nodeBorder = 'border-slate-800';
    let nodeBg = 'bg-slate-900/90';
    let nodeGlow = '';

    if (heatmapMode === 'bottlenecks') {
      if (isWaitBottleneck) {
        nodeBorder = 'border-rose-500';
        nodeBg = 'bg-rose-950/40';
        nodeGlow = 'ring-2 ring-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)]';
      } else if (wtHours / maxWaitHours > 0.6) {
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
        className={`relative group rounded-2xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between select-none ${
          inParallelLane ? 'w-full' : 'w-72 sm:w-80'
        } ${nodeBorder} ${nodeBg} ${nodeGlow} ${
          isSelected ? 'ring-2 ring-cyan-400 scale-[1.02] z-20 shadow-2xl' : 'hover:scale-[1.01]'
        }`}
      >
        {/* Critical Wait Bottleneck Flag */}
        {isWaitBottleneck && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-rose-950/60 animate-bounce z-10">
            <Flame className="w-3 h-3" />
            <span>Maior Gargalo</span>
          </div>
        )}

        {/* Critical Quality Bottleneck (%C&A) */}
        {isAccuracyBottleneck && !isWaitBottleneck && step.percentCompleteAndAccurate < 80 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-purple-950/60 z-10">
            <AlertTriangle className="w-3 h-3" />
            <span>Gargalo %C&A ({step.percentCompleteAndAccurate}%)</span>
          </div>
        )}

        {/* Node Top: Order Number & Role */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-black text-cyan-400 flex items-center justify-center shadow-inner">
              #{step.order}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border truncate max-w-[120px] ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
              {step.role}
            </span>
          </div>

          {/* Kaizen Burst Tag */}
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

        {/* Visual Time Metrics & Proportional Gauge */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            
            {/* PT with Didactic Click */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGlossary?.('pt');
              }}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group/pt"
              title="PT = Process Time (Tempo de Esforço Real). Clique para aprender."
            >
              <Zap className="w-3 h-3" />
              <span>PT: {step.processTime}{step.processTimeUnit.slice(0, 1)}</span>
              <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover/pt:opacity-100" />
            </button>

            {/* WT with Didactic Click */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGlossary?.('wt');
              }}
              className={`flex items-center gap-1 font-bold group/wt ${
                isWaitBottleneck ? 'text-rose-400 font-black' : 'text-amber-400 hover:text-amber-300'
              }`}
              title="WT = Wait Time (Tempo de Espera em Fila). Clique para aprender."
            >
              <Clock className="w-3 h-3" />
              <span>WT: {step.waitTime}{step.waitTimeUnit.slice(0, 1)}</span>
              <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover/wt:opacity-100" />
            </button>

          </div>

          {/* Proportional PT vs WT Split Bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
            <div
              style={{ width: `${Math.max(5, stepTotal > 0 ? (ptHours / stepTotal) * 100 : 50)}%` }}
              className="h-full bg-cyan-400 transition-all"
              title={`Tempo Ativo (Esforço): ${formatHours(ptHours)}`}
            />
            <div
              style={{ width: `${Math.max(5, stepTotal > 0 ? (wtHours / stepTotal) * 100 : 50)}%` }}
              className={`h-full transition-all ${isWaitBottleneck ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
              title={`Tempo Parado (Fila): ${formatHours(wtHours)}`}
            />
          </div>

          {/* Flow Efficiency & Accuracy Footer */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGlossary?.('fe');
              }}
              className="hover:text-slate-200 transition-colors"
              title="Eficiência de Fluxo = PT / (PT + WT). Clique para ver a fórmula."
            >
              Efic: <strong className="text-slate-200">{stepTotal > 0 ? ((ptHours / stepTotal) * 100).toFixed(0) : 0}%</strong>
            </button>

            {/* %C&A Didactic Pill Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGlossary?.('ca');
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-800/40 hover:border-purple-400 transition-colors group/ca"
              title="%C&A (Percent Complete and Accurate): Porcentagem de entregas recebidas sem erros ou retrabalho. Clique para aprender!"
            >
              <span className="text-purple-300 font-bold group-hover/ca:underline">%C&A:</span>
              <strong className={step.percentCompleteAndAccurate >= 90 ? 'text-emerald-400' : 'text-purple-300'}>
                {step.percentCompleteAndAccurate}%
              </strong>
              <HelpCircle className="w-2.5 h-2.5 text-purple-400 opacity-70 group-hover/ca:opacity-100 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Parallel Step Notch */}
        {step.isParallel && (
          <div className="mt-2 pt-1 border-t border-slate-800/60 text-[9px] font-mono font-bold text-purple-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              <span>Em Paralelo</span>
            </span>
            <span className="text-slate-500 font-normal">Trilha Simultânea</span>
          </div>
        )}
      </div>
    );
  };

  // Render Inter-Step Connecting Bridge (Pipeline Connector)
  const renderConnectingBridge = (nextStep: VSMStep, keyPrefix: string) => {
    const wtHours = convertTimeToHours(nextStep.waitTime, nextStep.waitTimeUnit, true);
    const isWaitBottleneck = metrics.maxWaitStep?.id === nextStep.id;

    return (
      <div
        key={`${keyPrefix}-bridge-to-${nextStep.id}`}
        className="flex items-center justify-center relative my-4 lg:my-0 px-2 group shrink-0"
      >
        {/* Horizontal Bridge Line for md+ screens */}
        <div className="hidden lg:flex flex-col items-center justify-center w-24 sm:w-28 relative">
          
          {/* Wait Time Queue Bubble (Floating on bridge) */}
          <div
            onClick={() => onOpenGlossary?.('wt')}
            className={`mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all border flex items-center gap-1 shadow-md ${
              isWaitBottleneck
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
                : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400'
            }`}
            title={`Tempo de Espera em Fila antes da etapa #${nextStep.order}: ${nextStep.waitTime} ${nextStep.waitTimeUnit}. Clique para aprender sobre WT.`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>WT: {nextStep.waitTime}{nextStep.waitTimeUnit.slice(0, 1)}</span>
          </div>

          {/* Animated Pipeline Beam */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 relative overflow-hidden flex items-center">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isWaitBottleneck
                ? 'from-amber-500 via-rose-500 to-amber-500 animate-pulse'
                : 'from-cyan-500 via-teal-400 to-cyan-500'
            } opacity-75`} />
            
            {/* Traveling Laser Pulse Dot */}
            <div className="w-3 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
          </div>

          {/* Directional Chevron Arrow */}
          <div className="mt-1 flex items-center text-slate-500 group-hover:text-cyan-400 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Vertical Bridge for mobile screens */}
        <div className="flex lg:hidden flex-col items-center justify-center h-16 relative">
          <div
            onClick={() => onOpenGlossary?.('wt')}
            className="px-2 py-0.5 rounded-full bg-slate-900 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-md cursor-pointer"
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Fila: {nextStep.waitTime}{nextStep.waitTimeUnit.slice(0, 1)}</span>
          </div>
          <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-slate-800 rounded-full my-1" />
          <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl bg-[#050811] border border-slate-800/90 shadow-2xl overflow-hidden relative">
      
      {/* 1. Top Controls Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <h2 className="text-base font-bold text-white font-heading">
              Mapa Abstrato com Pontes e Bifurcações
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
              Topologia Lean
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize as pontes de handoff, filas de espera (WT) e bifurcações paralelas com atividades simultâneas.
          </p>
        </div>

        {/* Heatmap Mode Selector & Glossary Button */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Glossary Direct Button */}
          <button
            type="button"
            onClick={() => onOpenGlossary?.('ca')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-950/30"
            title="Aprenda o que significa %C&A e todas as siglas Lean"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>O que é %C&A?</span>
          </button>

          {/* Color Mode Switcher */}
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
              <span>Gargalos</span>
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
              <span>Papéis</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Interactive Didactic Section: "Aprenda Enquanto Usa - O que é %C&A?" */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-purple-950/20 via-slate-950 to-cyan-950/20 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Dicionário Lean Ativo: Entendendo as Siglas do Fluxo
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCaExplainer(!showCaExplainer)}
              className="text-[11px] font-mono text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{showCaExplainer ? 'Recolher explicação' : 'O que significa %C&A?'}</span>
              {showCaExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Prominent Educational Card for %C&A */}
        {showCaExplainer && (
          <div className="mt-3 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-200">
            <div className="md:col-span-4 border-r border-purple-500/20 pr-4 space-y-1">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/40">
                Conceito Fundamental
              </span>
              <h3 className="text-sm font-black text-white font-heading">
                %C&A = Percent Complete & Accurate
              </h3>
              <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
                Traduz-se por <strong>Percentual Completo e Preciso (ou Correto)</strong>. Mede a qualidade na fonte em processos de escritório e RH.
              </p>
              <div className="pt-1 text-[10px] font-mono text-purple-300">
                📐 Fórmula: <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-purple-500/40 text-purple-200">(Entregas 100% Corretas ÷ Total) × 100</code>
              </div>
            </div>

            <div className="md:col-span-5 space-y-1">
              <h4 className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                <span>💡 Exemplo Real no RH (Admissão / Contratação):</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                O candidato envia fotos dos documentos de admissão. Se a foto do RG vier cortada, sem CPF legível ou faltando o comprovante de residência, o DP não consegue avançar e precisa ligar ou mandar e-mail pedindo reenvio. Se de cada <strong>10 admissões, 3 têm documentos com erro</strong>, o %C&A dessa etapa é de apenas <strong>70%</strong>.
              </p>
            </div>

            <div className="md:col-span-3 flex flex-col justify-between pl-0 md:pl-2 pt-2 md:pt-0 border-t md:border-t-0 border-purple-500/20">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Por que isso importa?
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Erros invisíveis causam e-mails de cobrança, retrabalho e atrasos no processo todo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenGlossary?.('ca')}
                className="mt-2 w-full py-1.5 px-3 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Abrir Guia Lean Completo</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. Main Topology Stream Container with Visual Bridges */}
      <div className="p-6 sm:p-8 min-h-[460px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] overflow-x-auto custom-scrollbar">
        
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-start gap-4 lg:gap-2 min-w-max py-6">
          
          {flowBlocks.map((block, bIdx) => {
            const isLastBlock = bIdx === flowBlocks.length - 1;
            
            const nextBlock = !isLastBlock ? flowBlocks[bIdx + 1] : null;
            const nextStep = nextBlock
              ? nextBlock.type === 'single'
                ? nextBlock.step
                : nextBlock.steps[0]
              : null;

            if (block.type === 'single') {
              return (
                <React.Fragment key={`single-block-${block.step.id}`}>
                  {/* Step Card Node */}
                  {renderStepNode(block.step, false)}

                  {/* Inter-Block Connecting Bridge */}
                  {nextStep && renderConnectingBridge(nextStep, `block-${bIdx}`)}
                </React.Fragment>
              );
            }

            // PARALLEL BLOCK (Bifurcation + Parallel Lanes + Convergence Join)
            return (
              <React.Fragment key={`parallel-block-${block.startIndex}`}>
                
                <div className="rounded-3xl p-4 sm:p-5 bg-purple-950/20 border-2 border-purple-500/40 shadow-2xl relative flex flex-col justify-between my-4 lg:my-0">
                  
                  {/* Top Incoming Fork Connector (Bifurcação de Fluxo) */}
                  <div className="mb-4 pb-3 border-b border-purple-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-purple-500 text-slate-950">
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-purple-300 font-heading block">
                          ⚡ Bifurcação Paralela (Atividades Simultâneas)
                        </span>
                        <span className="text-[10px] text-purple-200/70 font-mono">
                          {block.steps.length} etapas executadas ao mesmo tempo no processo
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/50 text-[10px] font-mono text-purple-200">
                      Fork de Fluxo
                    </span>
                  </div>

                  {/* Parallel Lanes Side-by-Side */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-4 relative">
                    {block.steps.map((pStep, pIdx) => (
                      <div
                        key={pStep.id}
                        className="flex flex-col flex-1 min-w-[260px] max-w-[320px] rounded-2xl p-2.5 bg-slate-950/60 border border-purple-500/30 relative"
                      >
                        {/* Lane Header Pill */}
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                            Trilha Paralela {String.fromCharCode(65 + pIdx)}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Simultâneo
                          </span>
                        </div>

                        {/* Step Card inside this parallel lane */}
                        {renderStepNode(pStep, true)}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Outgoing Convergence Joiner (Convergência de Fluxo) */}
                  <div className="mt-4 pt-3 border-t border-purple-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                      <span className="text-[11px] font-bold text-slate-300 font-mono">
                        ✦ Ponto de Sincronização (Join)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      O fluxo só avança após todas as trilhas terminarem
                    </span>
                  </div>

                </div>

                {/* Bridge to next block after convergence */}
                {nextStep && renderConnectingBridge(nextStep, `after-parallel-${block.startIndex}`)}

              </React.Fragment>
            );
          })}

        </div>

      </div>

      {/* 4. Slide-over Detail Inspector Drawer (When a node is selected) */}
      {selectedStep && (
        <div className="p-5 bg-slate-950/95 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-xs font-mono font-black">
                #{selectedStep.order}
              </span>
              <h3 className="text-sm font-bold text-white font-heading">
                {selectedStep.title}
              </h3>
              <span className="text-xs text-slate-400">
                • Responsável: {selectedStep.role}
              </span>
              {selectedStep.isParallel && (
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                  ⚡ Etapa Simultânea
                </span>
              )}
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
              <strong className="text-purple-300">{selectedStep.percentCompleteAndAccurate}%</strong>
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

      {/* 5. Bottom Legend & Learning Tips Strip */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/50 animate-pulse" />
            <span className="text-rose-300 font-bold">Gargalo Crítico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Esforço (PT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Fila (WT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-purple-300">Qualidade (%C&A)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-300">Bifurcação Paralela</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          💡 Dica: Clique em qualquer sigla (%C&A, PT, WT, Efic) para abrir a explicação detalhada.
        </span>
      </div>

    </div>
  );
};
