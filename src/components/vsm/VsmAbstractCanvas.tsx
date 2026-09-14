'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  ZoomIn,
  ZoomOut,
  Maximize,
  Maximize2,
  Minimize2,
  RotateCcw,
  Move,
  GripHorizontal,
  Hand,
  MousePointer,
  Lock,
  Unlock,
  Plus,
  Copy,
  Trash2,
  Workflow
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  getRoleStyle,
  groupStepsIntoStages,
  getStepKaizens
} from '@/lib/vsmCalculations';

interface VsmAbstractCanvasProps {
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  onEditStep: (step: VSMStep) => void;
  onNewStep?: (insertAtIndex?: number) => void;
  onDeleteStep?: (stepId: string) => void;
  onDuplicateStep?: (step: VSMStep) => void;
  onOpenKaizenNotes: (step: VSMStep) => void;
  onOpenGlossary?: (topic?: string) => void;
  onOpenAiDiagnostic?: () => void;
}

type HeatmapMode = 'bottlenecks' | 'accuracy' | 'roles';
type CanvasMode = 'pan' | 'select';

interface NodePos {
  x: number;
  y: number;
}

interface EdgeConnection {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  nextStep: VSMStep;
  isParallelBranch: boolean;
  isBottleneck: boolean;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 135;
const GAP_X = 130;
const GAP_Y = 165;
const BASE_Y = 280;

export const VsmAbstractCanvas: React.FC<VsmAbstractCanvasProps> = ({
  steps,
  metrics,
  onEditStep,
  onNewStep,
  onDeleteStep,
  onDuplicateStep,
  onOpenKaizenNotes,
  onOpenGlossary,
  onOpenAiDiagnostic
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('bottlenecks');
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('pan');
  const [isLocked, setIsLocked] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showCaExplainer, setShowCaExplainer] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  // Transform state: pan & zoom
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartPosRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0
  });

  // Custom node positions
  const [customPositions, setCustomPositions] = useState<Record<string, NodePos>>({});

  // Calculate default auto-layout with realistic branching for parallel steps
  const defaultPositions = useMemo(() => {
    const posMap: Record<string, NodePos> = {};
    if (steps.length === 0) return posMap;

    // Group steps into stages: consecutive parallel steps share a stage
    const stages = groupStepsIntoStages(steps);

    stages.forEach((stageSteps, sIdx) => {
      const stageX = 60 + sIdx * (NODE_WIDTH + GAP_X);
      const n = stageSteps.length;

      stageSteps.forEach((step, i) => {
        let stageY = BASE_Y;
        if (n > 1) {
          // Spread parallel branches symmetrically above and below center line
          const offset = (i - (n - 1) / 2) * GAP_Y;
          stageY = BASE_Y + offset;
        }
        posMap[step.id] = { x: stageX, y: stageY };
      });
    });

    return posMap;
  }, [steps]);

  // Combined positions: custom position overrides default position
  const activePositions = useMemo(() => {
    const combined: Record<string, NodePos> = {};
    steps.forEach(step => {
      combined[step.id] = customPositions[step.id] || defaultPositions[step.id] || { x: 100, y: 250 };
    });
    return combined;
  }, [steps, customPositions, defaultPositions]);

  // Selected step details
  const selectedStep = useMemo(
    () => steps.find(s => s.id === selectedStepId) || null,
    [steps, selectedStepId]
  );

  // Fit view to screen (Auto-Zoom to show entire macro structure without scrolling)
  const handleFitToView = useCallback(() => {
    if (!containerRef.current || steps.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    Object.values(activePositions).forEach(pos => {
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + NODE_WIDTH > maxX) maxX = pos.x + NODE_WIDTH;
      if (pos.y + NODE_HEIGHT > maxY) maxY = pos.y + NODE_HEIGHT;
    });

    const contentWidth = maxX - minX + 80;
    const contentHeight = maxY - minY + 80;

    const containerW = containerRef.current.clientWidth || 900;
    const containerH = containerRef.current.clientHeight || 550;

    const scaleX = (containerW - 80) / contentWidth;
    const scaleY = (containerH - 80) / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.05);

    const centerX = (containerW - (maxX - minX + NODE_WIDTH) * newZoom) / 2 - minX * newZoom;
    const centerY = (containerH - (maxY - minY + NODE_HEIGHT) * newZoom) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPan({ x: centerX, y: centerY });
  }, [activePositions, steps]);

  // Trigger fit view on initial mount and when steps count changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToView();
    }, 150);
    return () => clearTimeout(timer);
  }, [steps.length]);

  // Reset positions to clean auto-layout
  const handleResetPositions = () => {
    setCustomPositions({});
    setTimeout(() => {
      handleFitToView();
    }, 50);
  };

  // Fullscreen toggler
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Fullscreen lifecycle & Esc key handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      setTimeout(() => {
        handleFitToView();
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, handleFitToView]);

  // Zoom preset handlers
  const handleSetZoom = (targetZoom: number) => {
    if (!containerRef.current) {
      setZoom(targetZoom);
      return;
    }
    const containerW = containerRef.current.clientWidth || 900;
    const containerH = containerRef.current.clientHeight || 550;
    const centerX = containerW / 2;
    const centerY = containerH / 2;

    const newPanX = centerX - (centerX - pan.x) * (targetZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (targetZoom / zoom);

    setZoom(targetZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleZoomIn = () => handleSetZoom(Math.min(2.5, zoom + 0.15));
  const handleZoomOut = () => handleSetZoom(Math.max(0.35, zoom - 0.15));

  // Wheel zoom handler: Only zoom if Ctrl/Meta is pressed to protect native page scrolling!
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.min(2.5, Math.max(0.35, zoom * zoomFactor));

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
    // If Ctrl is not pressed, normal page scroll continues untouched!
  };

  // Canvas Pan Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive="true"]')) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (draggingNodeId && !isLocked) {
      const deltaX = (e.clientX - dragStartPosRef.current.mouseX) / zoom;
      const deltaY = (e.clientY - dragStartPosRef.current.mouseY) / zoom;

      setCustomPositions(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(dragStartPosRef.current.nodeX + deltaX),
          y: Math.round(dragStartPosRef.current.nodeY + deltaY)
        }
      }));
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // Node Drag Initiator
  const handleNodeDragStart = (e: React.PointerEvent, stepId: string) => {
    if (isLocked) return;
    e.stopPropagation();
    setDraggingNodeId(stepId);
    const currPos = activePositions[stepId] || { x: 0, y: 0 };
    dragStartPosRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: currPos.x,
      nodeY: currPos.y
    };
  };

  // Compute connections/edges between stages
  const edges: EdgeConnection[] = useMemo(() => {
    const list: EdgeConnection[] = [];
    const stages = groupStepsIntoStages(steps);

    // Connect Stage s to Stage s + 1
    for (let s = 0; s < stages.length - 1; s++) {
      const currentStageSteps = stages[s];
      const nextStageSteps = stages[s + 1];

      currentStageSteps.forEach(fromStep => {
        const fromPos = activePositions[fromStep.id];
        if (!fromPos) return;

        nextStageSteps.forEach(toStep => {
          const toPos = activePositions[toStep.id];
          if (!toPos) return;

          const isBottleneck = metrics.maxWaitStep?.id === toStep.id;

          list.push({
            fromId: fromStep.id,
            toId: toStep.id,
            fromX: fromPos.x + NODE_WIDTH,
            fromY: fromPos.y + NODE_HEIGHT / 2,
            toX: toPos.x,
            toY: toPos.y + NODE_HEIGHT / 2,
            nextStep: toStep,
            isParallelBranch: Boolean(fromStep.isParallel || toStep.isParallel),
            isBottleneck
          });
        });
      });
    }

    return list;
  }, [steps, activePositions, metrics.maxWaitStep]);

  // Max wait hours for proportional colors
  const maxWaitHours = useMemo(() => {
    return Math.max(
      ...steps.map(s => convertTimeToHours(s.waitTime, s.waitTimeUnit, true)),
      1
    );
  }, [steps]);

  // Calculate bounding box for minimap
  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    Object.values(activePositions).forEach(pos => {
      if (pos.x < minX) minX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.x + NODE_WIDTH > maxX) maxX = pos.x + NODE_WIDTH;
      if (pos.y + NODE_HEIGHT > maxY) maxY = pos.y + NODE_HEIGHT;
    });

    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 600, width: 1000, height: 600 };
    }

    const pad = 60;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2
    };
  }, [activePositions]);

  if (steps.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-950 border border-slate-800 text-slate-400 font-mono space-y-4">
        <p>Nenhuma etapa no fluxo para visualização macro.</p>
        {onNewStep && (
          <button
            type="button"
            onClick={() => onNewStep()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-teal-400 transition-all cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Primeira Tarefa</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-40 w-screen h-screen bg-[#050811] flex flex-col p-2 sm:p-4 overflow-hidden'
          : 'rounded-3xl bg-[#050811] border border-slate-800/90 shadow-2xl overflow-hidden relative'
      }`}
    >
      
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 relative shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <h2 className="text-base font-bold text-white font-heading">
              Mapa Macro Dinâmico com Ramificação Interativa
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
              Whiteboard Macro
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão panorâmica em tela cheia com arraste fluido, ajuste automático de escala e ramificações Bézier.
          </p>
        </div>

        {/* Heatmap Mode Selector & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* New Step Action Button */}
          {onNewStep && (
            <button
              type="button"
              onClick={() => onNewStep()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
              title="Adicionar uma nova etapa/tarefa ao fluxo VSM"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Nova Tarefa</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/50'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title={isFullscreen ? 'Sair da Tela Cheia (ESC)' : 'Visualizar Mapa Abstrato em Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}</span>
          </button>

          {/* AI Diagnostic Trigger Button */}
          {onOpenAiDiagnostic && (
            <button
              type="button"
              onClick={onOpenAiDiagnostic}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 hover:from-purple-500 hover:to-cyan-400 active:scale-95 transition-all cursor-pointer"
              title="Gerar Diagnóstico Executivo com Inteligência Artificial"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>Diagnóstico IA</span>
            </button>
          )}

          {/* Quick %C&A Button */}
          <button
            type="button"
            onClick={() => setShowCaExplainer(!showCaExplainer)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Aprender o que significa %C&A"
          >
            <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
            <span>O que é %C&A?</span>
            {showCaExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
              <span>%C&A</span>
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

      {/* 2. Educational Explainer Accordion for %C&A */}
      {showCaExplainer && (
        <div className="border-b border-slate-800/80 bg-gradient-to-r from-purple-950/40 via-slate-950 to-cyan-950/30 p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 border-r border-purple-500/20 pr-4 space-y-1">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/40">
                Conceito Fundamental de Qualidade
              </span>
              <h3 className="text-sm font-black text-white font-heading">
                %C&A: Percent Complete & Accurate
              </h3>
              <p className="text-[11px] text-purple-200/80 leading-relaxed font-sans">
                Representa o <strong>Percentual Completo e Preciso (ou Correto)</strong>. Mede quantas vezes o trabalho passa de um setor para outro sem necessidade de correções, dúvidas ou retrabalho.
              </p>
              <div className="pt-1 text-[10px] font-mono text-purple-300">
                📐 Fórmula: <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-purple-500/40 text-purple-200">(Entregas Perfeitas ÷ Total) × 100</code>
              </div>
            </div>

            <div className="md:col-span-5 space-y-1">
              <h4 className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                <span>💡 Exemplo Real no RH (Admissão de Colaborador):</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                O candidato envia fotos dos documentos. Se a foto do RG vier cortada ou faltar o comprovante bancário, o DP é forçado a parar tudo e cobrar o reenvio. Se em <strong>10 admissões, 3 têm documentos com erro</strong>, o %C&A dessa etapa é de apenas <strong>70%</strong>.
              </p>
            </div>

            <div className="md:col-span-3 flex flex-col justify-between pl-0 md:pl-2 pt-2 md:pt-0 border-t md:border-t-0 border-purple-500/20">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Efeito Cascata Invisível
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Se 5 etapas seguidas tiverem 90% C&A, o rendimento final (RFPY) despenca para <strong>59%</strong>!
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
        </div>
      )}

      {/* 3. Main Infinite Macro Interactive Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        className={`relative w-full ${
          isFullscreen ? 'flex-1 h-full min-h-[420px]' : 'h-[640px]'
        } overflow-hidden bg-[#060a13] bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:24px_24px] ${
          isPanning ? 'cursor-grabbing' : canvasMode === 'pan' ? 'cursor-grab' : 'cursor-default'
        }`}
      >
        
        {/* Floating Canvas Camera & Mode Toolbar (Top Left) */}
        <div
          data-interactive="true"
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md flex-wrap"
        >
          {/* Mode Switcher: Pan vs Select */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setCanvasMode('pan')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                canvasMode === 'pan'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo Mover Tela: clique e arraste em qualquer lugar para navegar"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Mover Tela</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasMode('select')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                canvasMode === 'select'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo Seleção: clique nos cartões para abrir detalhes e editar"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Selecionar</span>
            </button>
          </div>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          {/* Zoom Buttons & Percentage */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Afastar (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Preset Zoom Pills */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetZoom(0.5)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                Math.abs(zoom - 0.5) < 0.08 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleSetZoom(0.75)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                Math.abs(zoom - 0.75) < 0.08 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => handleSetZoom(1.0)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                Math.abs(zoom - 1.0) < 0.08 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              100%
            </button>
          </div>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Aproximar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          {/* Fit to View button: Satisfies "visualizar toda a estrutura na tela" */}
          <button
            type="button"
            onClick={handleFitToView}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-sm"
            title="Ajustar toda a estrutura na tela (Visão Macro Panorâmica)"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Ajustar à Tela</span>
          </button>

          {/* Reset layout */}
          <button
            type="button"
            onClick={handleResetPositions}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Auto-organizar nós (Resetar Posições)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Lock / Unlock Dragging toggle */}
          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isLocked ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isLocked ? 'Posições bloqueadas (clique para destravar e arrastar nós)' : 'Posições destravadas (clique para travar nós)'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          {/* Quick Add Step Floating Button */}
          {onNewStep && (
            <button
              type="button"
              onClick={() => onNewStep()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Adicionar nova etapa / tarefa ao fluxo"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Tarefa</span>
            </button>
          )}

          {/* Fullscreen Floating Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/50'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title={isFullscreen ? 'Sair da Tela Cheia (ESC)' : 'Visualizar Mapa Abstrato em Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
          </button>
        </div>

        {/* Floating Hint Tag (Top Right) */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 shadow-xl backdrop-blur-md">
          <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Arraste para mover tela • Ctrl + Scroll para zoom</span>
        </div>

        {/* Empty State Overlay */}
        {steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/95 border border-slate-800 text-center max-w-sm pointer-events-auto shadow-2xl backdrop-blur-md space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                <Workflow className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white font-heading">
                Mapa Abstrato em Branco
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nenhuma etapa cadastrada ainda. Comece adicionando a primeira etapa da dinâmica para visualizar o fluxo em rede.
              </p>
              {onNewStep && (
                <button
                  type="button"
                  onClick={() => onNewStep(0)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeira Etapa</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transformable Canvas Surface */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
          className="absolute inset-0 pointer-events-none transition-transform duration-75 ease-out"
        >
          
          {/* SVG Connecting Bridges & Branching Bezier Curves */}
          <svg
            className="absolute inset-0 overflow-visible pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <marker
                id="arrow-cyan"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
              </marker>

              <marker
                id="arrow-rose"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
              </marker>

              <marker
                id="arrow-purple"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#a855f7" />
              </marker>

              <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((edge, idx) => {
              const dx = Math.max(Math.abs(edge.toX - edge.fromX) * 0.55, 60);
              const pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX + dx} ${edge.fromY}, ${edge.toX - dx} ${edge.toY}, ${edge.toX} ${edge.toY}`;

              const midX = (edge.fromX + edge.toX) / 2;
              const midY = (edge.fromY + edge.toY) / 2;

              let strokeColor = '#334155';
              let marker = 'url(#arrow-cyan)';

              if (edge.isBottleneck) {
                strokeColor = '#f43f5e';
                marker = 'url(#arrow-rose)';
              } else if (edge.isParallelBranch) {
                strokeColor = '#a855f7';
                marker = 'url(#arrow-purple)';
              } else {
                strokeColor = '#06b6d4';
              }

              return (
                <g key={`edge-${edge.fromId}-${edge.toId}-${idx}`}>
                  
                  {edge.isBottleneck && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={6}
                      opacity={0.35}
                      filter="url(#glow-rose)"
                    />
                  )}

                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={edge.isBottleneck ? 3.5 : edge.isParallelBranch ? 2.5 : 2}
                    strokeDasharray={edge.isParallelBranch ? '6 4' : undefined}
                    markerEnd={marker}
                    className="transition-all duration-150"
                  />

                  {/* Laser Pulse Dot moving along path */}
                  <circle r={edge.isBottleneck ? 3.5 : 2.5} fill={edge.isBottleneck ? '#ffffff' : '#38bdf8'}>
                    <animateMotion
                      path={pathD}
                      dur={edge.isBottleneck ? '1.8s' : '3s'}
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Interactive WT Queue Badge at Midpoint */}
                  <foreignObject
                    x={midX - 45}
                    y={midY - 14}
                    width={90}
                    height={28}
                    className="overflow-visible pointer-events-auto"
                  >
                    <div
                      data-interactive="true"
                      onClick={() => onOpenGlossary?.('wt')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all border ${
                        edge.isBottleneck
                          ? 'bg-rose-950/90 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 animate-pulse'
                          : edge.isParallelBranch
                          ? 'bg-slate-950/90 border-purple-500/50 text-purple-300 hover:border-purple-400'
                          : 'bg-slate-950/90 border-amber-500/40 text-amber-300 hover:border-amber-400'
                      }`}
                      title={`Fila de espera (WT): ${edge.nextStep.waitTime} ${edge.nextStep.waitTimeUnit}. Clique para aprender sobre WT.`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{edge.nextStep.waitTime}{edge.nextStep.waitTimeUnit.slice(0, 1)}</span>
                    </div>
                  </foreignObject>

                </g>
              );
            })}
          </svg>

          {/* Interactive Step Node Cards */}
          {steps.map(step => {
            const pos = activePositions[step.id] || { x: 100, y: 250 };
            const ptHours = convertTimeToHours(step.processTime, step.processTimeUnit, true);
            const wtHours = convertTimeToHours(step.waitTime, step.waitTimeUnit, true);
            const stepTotal = ptHours + wtHours;
            const isWaitBottleneck = metrics.maxWaitStep?.id === step.id;
            const isAccuracyBottleneck = metrics.lowestAccuracyStep?.id === step.id;
            const kaizens = getStepKaizens(step);
            const hasKaizen = kaizens.length > 0;
            const roleStyle = getRoleStyle(step.role);

            // Heatmap color logic
            let nodeBorder = 'border-slate-800';
            let nodeBg = 'bg-slate-900/95';
            let nodeGlow = '';

            if (heatmapMode === 'bottlenecks') {
              if (isWaitBottleneck) {
                nodeBorder = 'border-rose-500';
                nodeBg = 'bg-rose-950/40';
                nodeGlow = 'ring-2 ring-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.4)]';
              } else if (wtHours / maxWaitHours > 0.6) {
                nodeBorder = 'border-amber-500/70';
                nodeBg = 'bg-amber-950/25';
                nodeGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.25)]';
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
            const isDraggingThis = draggingNodeId === step.id;

            return (
              <div
                key={step.id}
                data-interactive="true"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`
                }}
                className={`group/card absolute pointer-events-auto rounded-2xl p-3.5 border flex flex-col justify-between transition-shadow backdrop-blur-md cursor-pointer ${nodeBorder} ${nodeBg} ${nodeGlow} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02] z-30 shadow-2xl' : 'hover:border-slate-700'
                } ${isDraggingThis ? 'cursor-grabbing z-40 opacity-95 scale-[1.03] shadow-2xl' : ''}`}
                onClick={() => setSelectedStepId(step.id === selectedStepId ? null : step.id)}
              >
                
                {/* Node Drag Handle Header */}
                <div
                  onPointerDown={(e) => handleNodeDragStart(e, step.id)}
                  className={`flex items-center justify-between gap-1 pb-1.5 border-b border-slate-800/80 group/drag ${
                    isLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                  }`}
                  title={isLocked ? 'Posições travadas' : 'Clique e arraste para reposicionar no canvas'}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-5 h-5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono font-black text-cyan-400 flex items-center justify-center shrink-0">
                      #{step.order}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border truncate max-w-[110px] ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                      {step.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {step.isParallel && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[8px] font-mono font-bold flex items-center gap-0.5">
                        <GitBranch className="w-2.5 h-2.5" />
                        <span>Ramo</span>
                      </span>
                    )}

                    {hasKaizen && (
                      <div
                        className="h-4 px-1.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center gap-0.5 shadow-md shadow-amber-400/30 font-mono font-black text-[9px] animate-pulse"
                        title={`Oportunidades de Kaizen (${kaizens.length}):\n${kaizens.map((k, i) => `${i + 1}. ${k}`).join('\n')}`}
                      >
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        {kaizens.length > 1 && <span>{kaizens.length}</span>}
                      </div>
                    )}

                    {!isLocked && (
                      <GripHorizontal className="w-3.5 h-3.5 text-slate-600 group-hover/drag:text-cyan-400 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Node Title */}
                <div className="my-1">
                  <h4 className="text-[11px] font-bold text-white font-heading line-clamp-1 leading-snug group-hover:text-cyan-300">
                    {step.title}
                  </h4>
                </div>

                {/* Metrics Row: PT, WT, %C&A */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGlossary?.('pt');
                      }}
                      className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="PT (Process Time / Esforço Real). Clique para aprender."
                    >
                      <Zap className="w-2.5 h-2.5" />
                      <span>{step.processTime}{step.processTimeUnit.slice(0, 1)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGlossary?.('wt');
                      }}
                      className={`flex items-center gap-0.5 font-bold cursor-pointer ${
                        isWaitBottleneck ? 'text-rose-400 font-black' : 'text-amber-400 hover:underline'
                      }`}
                      title="WT (Wait Time / Fila de Espera). Clique para aprender."
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{step.waitTime}{step.waitTimeUnit.slice(0, 1)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGlossary?.('ca');
                      }}
                      className="text-purple-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="%C&A (Percent Complete and Accurate). Clique para aprender."
                    >
                      <span>C&A:{step.percentCompleteAndAccurate}%</span>
                    </button>
                  </div>

                  {/* Dual PT vs WT Proportional Split Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
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
                </div>

                {/* Bottom Status / Bottleneck Tag */}
                <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[8px] font-mono text-slate-400">
                  <span>Efic: <strong className="text-slate-200">{stepTotal > 0 ? ((ptHours / stepTotal) * 100).toFixed(0) : 0}%</strong></span>
                  {isWaitBottleneck ? (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5 animate-pulse">
                      <Flame className="w-2.5 h-2.5" />
                      <span>Maior Gargalo</span>
                    </span>
                  ) : isAccuracyBottleneck && step.percentCompleteAndAccurate < 80 ? (
                    <span className="text-purple-400 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Gargalo %C&A</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Fluxo OK</span>
                  )}
                </div>

                {/* Quick Add Step After This Node */}
                {onNewStep && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewStep(step.order);
                    }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 z-30 opacity-0 group-hover/card:opacity-100 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                    title={`+ Inserir nova tarefa após #${step.order} (${step.title})`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                )}

              </div>
            );
          })}

        </div>

        {/* Floating MiniMap Radar (Bottom Right) */}
        {showMinimap && (
          <div
            data-interactive="true"
            className="absolute bottom-4 right-4 z-30 w-44 h-28 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl p-2 hidden sm:flex flex-col justify-between backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1 border-b border-slate-900">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Minimap Radar
              </span>
              <button
                type="button"
                onClick={() => setShowMinimap(false)}
                className="text-slate-600 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Radar Mini Stage */}
            <div className="relative w-full flex-1 mt-1 bg-slate-900/60 rounded-lg overflow-hidden border border-slate-800/60">
              {steps.map(step => {
                const pos = activePositions[step.id] || { x: 0, y: 0 };
                const rx = ((pos.x - bounds.minX) / bounds.width) * 100;
                const ry = ((pos.y - bounds.minY) / bounds.height) * 100;
                const isWaitBottleneck = metrics.maxWaitStep?.id === step.id;

                return (
                  <div
                    key={`mini-${step.id}`}
                    style={{ left: `${rx}%`, top: `${ry}%` }}
                    className={`absolute w-3 h-2 rounded-xs -translate-x-1/2 -translate-y-1/2 ${
                      isWaitBottleneck
                        ? 'bg-rose-500 ring-1 ring-rose-400'
                        : step.isParallel
                        ? 'bg-purple-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. Slide-over Detail Inspector Drawer (When a node is clicked) */}
      {selectedStep && (
        <div className="p-5 bg-slate-950/95 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200 z-20 relative">
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
                  ⚡ Ramo Simultâneo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {selectedStep.description || 'Sem descrição detalhada para esta etapa.'}
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

            {onNewStep && (
              <button
                type="button"
                onClick={() => onNewStep(selectedStep.order)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
                title={`Inserir uma nova etapa logo após #${selectedStep.order} (${selectedStep.title})`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Inserir a Seguir</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEditStep(selectedStep)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer shadow-md"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Etapa</span>
            </button>

            {onDuplicateStep && (
              <button
                type="button"
                onClick={() => onDuplicateStep(selectedStep)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Duplicar esta etapa"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>
            )}

            {onDeleteStep && (
              <button
                type="button"
                onClick={() => {
                  onDeleteStep(selectedStep.id);
                  setSelectedStepId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer"
                title="Remover esta etapa do fluxo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}

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

      {/* 5. Bottom Legend Strip */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-900 flex items-center justify-between text-xs font-mono text-slate-400 flex-wrap gap-3 z-10 relative">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/50 animate-pulse" />
            <span className="text-rose-300 font-bold">Maior Gargalo</span>
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
            <span className="text-slate-300">Ramificação Paralela</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          💡 Dica: Clique no botão "Ajustar à Tela" no canto superior esquerdo para ver o fluxo macro completo sem rolar.
        </span>
      </div>

    </div>
  );
};
