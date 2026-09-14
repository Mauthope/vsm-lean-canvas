'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Workflow,
  Sparkles,
  Layers,
  LayoutGrid,
  ListFilter,
  Plus,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Pencil,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { VSMStep, VSMProject, WasteType } from '@/types/vsm';
import { VSM_TEMPLATES } from '@/data/vsmTemplates';
import {
  calculateVsmMetrics,
  convertTimeToHours,
  formatHours,
  WASTE_METAS,
  getRoleStyle
} from '@/lib/vsmCalculations';
import { VsmHeader } from '@/components/vsm/VsmHeader';
import { VsmMetricsBar } from '@/components/vsm/VsmMetricsBar';
import { VsmCanvas } from '@/components/vsm/VsmCanvas';
import { VsmTimelineLadder } from '@/components/vsm/VsmTimelineLadder';
import { VsmAbstractCanvas } from '@/components/vsm/VsmAbstractCanvas';
import { VsmStepModal } from '@/components/vsm/VsmStepModal';
import { VsmKaizenBoard } from '@/components/vsm/VsmKaizenBoard';
import { VsmSummaryReportModal } from '@/components/vsm/VsmSummaryReportModal';
import { VsmGlossaryModal } from '@/components/vsm/VsmGlossaryModal';
import { VsmAiDiagnosticModal } from '@/components/vsm/VsmAiDiagnosticModal';
import { Toast, ToastItem } from '@/components/Toast';

const STORAGE_KEY = 'vsm_session_standalone_v1';

export default function VsmHomePage() {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Project Info State
  const [projectName, setProjectName] = useState('Recrutamento & Seleção (R&S)');
  const [department, setDepartment] = useState('Recursos Humanos / Talent Acquisition');
  const [steps, setSteps] = useState<VSMStep[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // UI View Controls
  const [activeTab, setActiveTab] = useState<'canvas' | 'abstract' | 'ladder' | 'table'>('canvas');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [wasteFilter, setWasteFilter] = useState<WasteType | 'todos'>('todos');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal Controls
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<VSMStep | null>(null);
  const [insertAtIndex, setInsertAtIndex] = useState<number | undefined>(undefined);
  const [isKaizenBoardOpen, setIsKaizenBoardOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [isAiDiagnosticOpen, setIsAiDiagnosticOpen] = useState(false);
  const [glossaryTopic, setGlossaryTopic] = useState<string>('ca');

  const handleOpenGlossary = (topic: string = 'ca') => {
    setGlossaryTopic(topic);
    setIsGlossaryModalOpen(true);
  };

  // Initialize from LocalStorage or default to R&S Template
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          setProjectName(parsed.name || 'Mapeamento de Fluxo de Valor');
          setDepartment(parsed.department || 'Corporativo');
          setSteps(parsed.steps);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão salva do VSM:', e);
    }

    // Default template (R&S)
    const defaultTpl = VSM_TEMPLATES[0];
    const initialSteps: VSMStep[] = defaultTpl.steps.map((s, idx) => ({
      ...s,
      id: `step-${Date.now()}-${idx}`
    }));
    setProjectName(defaultTpl.name);
    setDepartment(defaultTpl.department);
    setSteps(initialSteps);
    setIsLoaded(true);
  }, []);

  // Auto-save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        name: projectName,
        department,
        steps,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Erro ao persistir sessão VSM:', e);
    }
  }, [projectName, department, steps, isLoaded]);

  // Recalculate Lean metrics dynamically
  const metrics = useMemo(() => calculateVsmMetrics(steps), [steps]);

  // Unique roles for filtering
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    steps.forEach(s => {
      if (s.role) set.add(s.role);
    });
    return Array.from(set);
  }, [steps]);

  // Filtered steps for display
  const filteredSteps = useMemo(() => {
    return steps.filter(s => {
      const matchRole = roleFilter === 'todos' || s.role === roleFilter;
      const matchWaste = wasteFilter === 'todos' || (s.wasteTypes && s.wasteTypes.includes(wasteFilter));
      return matchRole && matchWaste;
    });
  }, [steps, roleFilter, wasteFilter]);

  // Count Kaizen notes
  const kaizenCount = useMemo(() => {
    return steps.filter(s => s.kaizenNotes && s.kaizenNotes.trim().length > 0).length;
  }, [steps]);

  // Handler: Load Template
  const handleLoadTemplate = (templateId: string) => {
    const tpl = VSM_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const newSteps: VSMStep[] = tpl.steps.map((s, idx) => ({
      ...s,
      id: `step-${Date.now()}-${idx}`
    }));

    setProjectName(tpl.name);
    setDepartment(tpl.department);
    setSteps(newSteps);
    showToast(`Modelo "${tpl.name}" carregado com sucesso!`, 'success');
  };

  // Handler: Reset Session
  const handleResetSession = () => {
    if (confirm('Deseja iniciar um novo mapeamento em branco? Todas as anotações não exportadas serão limpas.')) {
      handleLoadTemplate('template-blank');
    }
  };

  // Handler: Insert or Edit Step
  const handleOpenNewStepModal = (atIndex?: number) => {
    setEditingStep(null);
    setInsertAtIndex(atIndex);
    setIsStepModalOpen(true);
  };

  const handleOpenEditStepModal = (step: VSMStep) => {
    setEditingStep(step);
    setInsertAtIndex(undefined);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = (stepData: Omit<VSMStep, 'id' | 'order'> & { id?: string; order?: number }) => {
    if (stepData.id) {
      // Edit existing step
      setSteps(prev =>
        prev.map(s => (s.id === stepData.id ? { ...s, ...stepData } : s))
      );
      showToast('Etapa atualizada com sucesso!', 'success');
    } else {
      // Create new step
      const newStep: VSMStep = {
        ...stepData,
        id: `step-${Date.now()}`,
        order: (insertAtIndex !== undefined ? insertAtIndex : steps.length) + 1
      };

      const updated = [...steps];
      if (insertAtIndex !== undefined && insertAtIndex >= 0 && insertAtIndex <= steps.length) {
        updated.splice(insertAtIndex, 0, newStep);
      } else {
        updated.push(newStep);
      }

      // Reassign sequential orders
      const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
      setSteps(reordered);
      showToast(`Etapa #${newStep.order} inserida no fluxo!`, 'success');
    }
  };

  // Handler: Delete Step
  const handleDeleteStep = (stepId: string) => {
    const stepToDelete = steps.find(s => s.id === stepId);
    if (!stepToDelete) return;

    if (confirm(`Deseja remover a etapa "${stepToDelete.title}"?`)) {
      const remaining = steps.filter(s => s.id !== stepId);
      const reordered = remaining.map((s, idx) => ({ ...s, order: idx + 1 }));
      setSteps(reordered);
      showToast('Etapa removida.', 'info');
    }
  };

  // Handler: Duplicate Step
  const handleDuplicateStep = (step: VSMStep) => {
    const index = steps.findIndex(s => s.id === step.id);
    if (index === -1) return;

    const duplicated: VSMStep = {
      ...step,
      id: `step-${Date.now()}`,
      title: `${step.title} (Cópia)`
    };

    const updated = [...steps];
    updated.splice(index + 1, 0, duplicated);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
    showToast(`Etapa duplicada na posição #${index + 2}`, 'success');
  };

  // Handler: Reorder Step
  const handleMoveStep = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= steps.length || toIndex < 0 || toIndex >= steps.length) return;

    const updated = [...steps];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(reordered);
  };

  // Handler: Update Kaizen notes from board
  const handleUpdateKaizen = (stepId: string, notes: string) => {
    setSteps(prev =>
      prev.map(s => (s.id === stepId ? { ...s, kaizenNotes: notes } : s))
    );
    showToast('Oportunidade Kaizen atualizada!', 'success');
  };

  // Handler: Export JSON
  const handleExportJson = () => {
    const projectData: VSMProject = {
      id: `vsm-${Date.now()}`,
      name: projectName,
      department,
      leadTimeHours: metrics.totalLeadTimeHours,
      totalProcessTimeHours: metrics.totalProcessHours,
      flowEfficiency: metrics.flowEfficiency,
      overallYield: metrics.overallYield,
      steps
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VSM_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Projeto VSM exportado em JSON com sucesso!', 'success');
  };

  // Handler: Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.steps && Array.isArray(json.steps)) {
          setProjectName(json.name || 'Mapeamento Importado');
          setDepartment(json.department || 'Corporativo');
          setSteps(json.steps);
          showToast('Sessão VSM importada com sucesso!', 'success');
        } else {
          showToast('Arquivo JSON inválido. Formato VSM não reconhecido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-4 bg-[#060a13] min-h-screen' : ''}`}>
      
      {/* 1. Header Toolbar */}
      <VsmHeader
        projectName={projectName}
        department={department}
        onUpdateProjectInfo={(name, dept) => {
          setProjectName(name);
          setDepartment(dept);
        }}
        onLoadTemplate={handleLoadTemplate}
        onNewStep={() => handleOpenNewStepModal()}
        onOpenKaizenBoard={() => setIsKaizenBoardOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenGlossary={handleOpenGlossary}
        onOpenAiDiagnostic={() => setIsAiDiagnosticOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetSession={handleResetSession}
        kaizenCount={kaizenCount}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 2. Top BagTime KPI Metrics Bar */}
      <VsmMetricsBar
        metrics={metrics}
        steps={steps}
        onSelectStep={stepId => {
          const s = steps.find(x => x.id === stepId);
          if (s) handleOpenEditStepModal(s);
        }}
        onOpenGlossary={handleOpenGlossary}
        onOpenAiDiagnostic={() => setIsAiDiagnosticOpen(true)}
      />

      {/* 3. View Switcher & Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        
        {/* BagTime Segmented View Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 shadow-inner flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'canvas'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Whiteboard Detalhado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('abstract')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'abstract'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mapa Abstrato (Macro)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('ladder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ladder'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Dente de Serra (Ladder)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tabela Auditável</span>
          </button>
        </div>

        {/* Quick Filters: By Role & By Waste */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Role Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px] font-mono hidden md:inline">Papel:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="todos">Todos os Papéis ({steps.length})</option>
              {availableRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Waste Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 text-[11px] font-mono hidden md:inline">Desperdício:</span>
            <select
              value={wasteFilter}
              onChange={e => setWasteFilter(e.target.value as WasteType | 'todos')}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="todos">Todos os Desperdícios</option>
              {(Object.keys(WASTE_METAS) as WasteType[]).map(w => (
                <option key={w} value={w}>{WASTE_METAS[w].label}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* 4. Active Main Content Area */}
      {activeTab === 'canvas' && (
        <div className="space-y-6">
          <VsmCanvas
            steps={filteredSteps}
            metrics={metrics}
            onEditStep={handleOpenEditStepModal}
            onDeleteStep={handleDeleteStep}
            onDuplicateStep={handleDuplicateStep}
            onMoveStep={handleMoveStep}
            onInsertStepAtIndex={handleOpenNewStepModal}
            onOpenKaizenNotes={step => {
              setEditingStep(step);
              setIsStepModalOpen(true);
            }}
          />

          {/* Connected Timeline Ladder below canvas */}
          <VsmTimelineLadder
            steps={steps}
            metrics={metrics}
            onSelectStep={stepId => {
              const s = steps.find(x => x.id === stepId);
              if (s) handleOpenEditStepModal(s);
            }}
          />
        </div>
      )}

      {activeTab === 'abstract' && (
        <div className="space-y-6">
          <VsmAbstractCanvas
            steps={filteredSteps}
            metrics={metrics}
            onEditStep={handleOpenEditStepModal}
            onOpenKaizenNotes={step => {
              setEditingStep(step);
              setIsStepModalOpen(true);
            }}
            onOpenGlossary={handleOpenGlossary}
            onOpenAiDiagnostic={() => setIsAiDiagnosticOpen(true)}
          />

          {/* Connected Timeline Ladder below abstract canvas */}
          <VsmTimelineLadder
            steps={steps}
            metrics={metrics}
            onSelectStep={stepId => {
              const s = steps.find(x => x.id === stepId);
              if (s) handleOpenEditStepModal(s);
            }}
          />
        </div>
      )}

      {activeTab === 'ladder' && (
        <VsmTimelineLadder
          steps={steps}
          metrics={metrics}
          onSelectStep={stepId => {
            const s = steps.find(x => x.id === stepId);
            if (s) handleOpenEditStepModal(s);
          }}
        />
      )}

      {activeTab === 'table' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Matriz Auditável de Etapas do VSM
              </h3>
              <p className="text-xs text-slate-400">
                Visualize todos os apontamentos de esforço (PT), fila (WT), percentual completo e correto (%C&A) e anotações Kaizen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenNewStepModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Etapa</span>
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] uppercase font-bold font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">Título da Etapa</th>
                  <th className="p-3">Papel / Área</th>
                  <th className="p-3 text-right">PT (Esforço)</th>
                  <th className="p-3 text-right">WT (Fila)</th>
                  <th className="p-3 text-right">%C&A</th>
                  <th className="p-3">Desperdícios (Muda)</th>
                  <th className="p-3">Oportunidade Kaizen</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredSteps.map(step => {
                  const roleStyle = getRoleStyle(step.role);
                  return (
                    <tr key={step.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="p-3 text-center font-bold text-cyan-400">#{step.order}</td>
                      <td className="p-3 font-sans font-medium text-white max-w-xs">{step.title}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                          {step.role}
                        </span>
                      </td>
                      <td className="p-3 text-right text-cyan-300 font-bold">{step.processTime} {step.processTimeUnit}</td>
                      <td className="p-3 text-right text-amber-300 font-bold">{step.waitTime} {step.waitTimeUnit}</td>
                      <td className="p-3 text-right font-bold text-slate-200">{step.percentCompleteAndAccurate}%</td>
                      <td className="p-3 font-sans text-[11px] text-slate-400">
                        {step.wasteTypes?.map(w => WASTE_METAS[w]?.shortLabel).join(', ') || '-'}
                      </td>
                      <td className="p-3 font-sans text-[11px] text-amber-300 max-w-xs truncate">
                        {step.kaizenNotes ? `💡 ${step.kaizenNotes}` : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStepModal(step)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-300"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateStep(step)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(step.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modals & Drawers */}
      <VsmStepModal
        isOpen={isStepModalOpen}
        onClose={() => {
          setIsStepModalOpen(false);
          setEditingStep(null);
          setInsertAtIndex(undefined);
        }}
        onSave={handleSaveStep}
        initialStep={editingStep}
        insertAtIndex={insertAtIndex}
      />

      <VsmKaizenBoard
        isOpen={isKaizenBoardOpen}
        onClose={() => setIsKaizenBoardOpen(false)}
        steps={steps}
        onUpdateKaizen={handleUpdateKaizen}
      />

      <VsmSummaryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projectName={projectName}
        department={department}
        steps={steps}
        metrics={metrics}
      />

      <VsmGlossaryModal
        isOpen={isGlossaryModalOpen}
        onClose={() => setIsGlossaryModalOpen(false)}
        initialTopic={glossaryTopic}
      />

      <VsmAiDiagnosticModal
        isOpen={isAiDiagnosticOpen}
        onClose={() => setIsAiDiagnosticOpen(false)}
        projectName={projectName}
        department={department}
        steps={steps}
        metrics={metrics}
      />

      {/* Standalone Toast Alerts */}
      <Toast toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />

    </div>
  );
}
