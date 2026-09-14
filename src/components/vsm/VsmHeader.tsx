'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Sparkles,
  FileText,
  Download,
  Upload,
  RotateCcw,
  Maximize2,
  Minimize2,
  FolderOpen,
  ChevronDown,
  Building2,
  Pencil,
  BookOpen
} from 'lucide-react';
import { VSMTemplate, VSMStep } from '@/types/vsm';
import { VSM_TEMPLATES } from '@/data/vsmTemplates';

interface VsmHeaderProps {
  projectName: string;
  department: string;
  onUpdateProjectInfo: (name: string, dept: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onNewStep: () => void;
  onOpenKaizenBoard: () => void;
  onOpenReportModal: () => void;
  onOpenGlossary?: (topic?: string) => void;
  onOpenAiDiagnostic?: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSession: () => void;
  kaizenCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const VsmHeader: React.FC<VsmHeaderProps> = ({
  projectName,
  department,
  onUpdateProjectInfo,
  onLoadTemplate,
  onNewStep,
  onOpenKaizenBoard,
  onOpenReportModal,
  onOpenGlossary,
  onOpenAiDiagnostic,
  onExportJson,
  onImportJson,
  onResetSession,
  kaizenCount,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [tempDept, setTempDept] = useState(department);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  const handleSaveTitle = () => {
    onUpdateProjectInfo(tempName.trim() || 'Mapeamento de Fluxo de Valor', tempDept.trim() || 'Recursos Humanos');
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
      
      {/* Title & Department Info */}
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Workflow className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div>
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                className="bg-slate-900 border border-cyan-500 rounded-lg px-2.5 py-1 text-base font-bold text-white focus:outline-none"
                placeholder="Nome do Projeto..."
                autoFocus
              />
              <input
                type="text"
                value={tempDept}
                onChange={e => setTempDept(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                placeholder="Departamento..."
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                {projectName}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setTempName(projectName);
                  setTempDept(department);
                  setIsEditingTitle(true);
                }}
                className="p-1 rounded-md text-slate-500 hover:text-cyan-300 transition-colors"
                title="Renomear Projeto"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1 font-mono text-cyan-400/90 font-medium">
              <Building2 className="w-3 h-3" />
              <span>{department}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-500">Mapeamento de Fluxo de Valor ao Vivo</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* Template Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modelos Prontos</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isTemplateMenuOpen && (
            <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1 block font-mono">
                Carregar Fluxo Modelo:
              </span>
              <div className="space-y-1">
                {VSM_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onLoadTemplate(tpl.id);
                      setIsTemplateMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-900 transition-colors text-xs text-slate-200 block group"
                  >
                    <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {tpl.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lean Guide / Educational Glossary Button */}
        <button
          type="button"
          onClick={() => onOpenGlossary?.('ca')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Guia Didático e Glossário Lean: Aprenda conceitos e métricas (%C&A, PT, WT, etc.)"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Guia Lean</span>
        </button>

        {/* Kaizen Bursts Drawer Button */}
        <button
          type="button"
          onClick={onOpenKaizenBoard}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            kaizenCount > 0
              ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-md shadow-amber-950/20'
              : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Ver todos os Raios Kaizen da Dinâmica"
        >
          <Sparkles className={`w-3.5 h-3.5 ${kaizenCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span>Kaizen Bursts</span>
          {kaizenCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-black">
              {kaizenCount}
            </span>
          )}
        </button>

        {/* Executive Dossier & Print Report Button */}
        <button
          type="button"
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
          title="Gerar Dossiê Executivo e Relatório Pronto para Impressão / PDF"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Dossiê / Imprimir</span>
        </button>

        {/* AI Diagnostic Button */}
        <button
          type="button"
          onClick={onOpenAiDiagnostic}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer"
          title="Gerar Diagnóstico Aprofundado com Inteligência Artificial"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
          <span>Diagnóstico IA</span>
        </button>

        {/* Export / Import JSON */}
        <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-800 p-0.5">
          <button
            type="button"
            onClick={onExportJson}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exportar Sessão em JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <label
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Importar Sessão JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".json"
              onChange={onImportJson}
              className="hidden"
            />
          </label>
        </div>

        {/* Fullscreen / Presentation Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Apresentação / Tela Cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Primary "+ Nova Etapa" Button */}
        <button
          type="button"
          onClick={onNewStep}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Etapa</span>
        </button>

      </div>

    </div>
  );
};
