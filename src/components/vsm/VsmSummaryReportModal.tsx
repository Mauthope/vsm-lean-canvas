'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Printer,
  Copy,
  Check,
  Zap,
  Clock,
  Percent,
  Layers,
  AlertTriangle,
  Building2,
  Sparkles,
  Award,
  BookOpen,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Eye,
  Settings2,
  Calendar,
  User,
  Lightbulb,
  FileCheck
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis, WasteType } from '@/types/vsm';
import {
  formatHours,
  getFlowEfficiencyClassification,
  countWastes,
  WASTE_METAS,
  convertTimeToHours
} from '@/lib/vsmCalculations';
import { generateVsmAiDiagnostic, AiDiagnosticReport } from '@/lib/vsmAiDiagnostic';

interface VsmSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  department: string;
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
  aiReport?: (AiDiagnosticReport & { provider?: string; isLiveAi?: boolean }) | null;
  onRunAiDiagnostic?: () => void;
  onSaveAiReport?: (report: AiDiagnosticReport & { provider?: string; isLiveAi?: boolean }) => void;
}

export const VsmSummaryReportModal: React.FC<VsmSummaryReportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  department,
  steps,
  metrics,
  aiReport,
  onRunAiDiagnostic,
  onSaveAiReport
}) => {
  // View mode: 'paper' (Clean White A4 sheet) or 'dark' (Executive Dark Screen)
  const [viewMode, setViewMode] = useState<'paper' | 'dark'>('paper');
  const [copied, setCopied] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [internalAiReport, setInternalAiReport] = useState<(AiDiagnosticReport & { provider?: string; isLiveAi?: boolean }) | null>(aiReport || null);

  // Editable dossier metadata
  const [consultantName, setConsultantName] = useState('Mauricio Grigol Prestes');
  const [reportVersion, setReportVersion] = useState('Versão 1.0 - Diagnóstico Inicial');
  const [companyName, setCompanyName] = useState('QualiDecision / Corporativo');
  const [showConfig, setShowConfig] = useState(false);

  // Modular sections inclusion toggles
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeBottlenecks, setIncludeBottlenecks] = useState(true);
  const [includeTable, setIncludeTable] = useState(true);
  const [includeSimulation, setIncludeSimulation] = useState(true);
  const [includeRoadmap, setIncludeRoadmap] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  // Sync internal state when external aiReport changes
  React.useEffect(() => {
    if (aiReport) setInternalAiReport(aiReport);
  }, [aiReport]);

  // Generate fallback heuristic analysis
  const fallbackReport: AiDiagnosticReport = useMemo(() => {
    return generateVsmAiDiagnostic(projectName, department, steps, metrics, 'all');
  }, [projectName, department, steps, metrics]);

  // Use the active AI diagnostic if available, otherwise fallback
  const diagnosticReport = internalAiReport || aiReport || fallbackReport;

  // Auto-fetch AI diagnostic as soon as modal is opened if not already generated!
  React.useEffect(() => {
    if (!isOpen) return;

    if (!internalAiReport && !aiReport) {
      handleAutoFetchAi();
    }
  }, [isOpen]);

  const handleAutoFetchAi = async () => {
    setIsGeneratingAi(true);
    try {
      let savedKey: string | undefined = undefined;
      try {
        savedKey = localStorage.getItem('vsm_user_ai_key') || undefined;
      } catch (e) {}

      const res = await fetch('/api/ai-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          department,
          steps,
          metrics,
          focusArea: 'all',
          userApiKey: savedKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInternalAiReport(data);
        onSaveAiReport?.(data);
      } else {
        setInternalAiReport(fallbackReport);
        onSaveAiReport?.(fallbackReport);
      }
    } catch (err) {
      console.warn('Falha no auto-fetch da IA para o dossiê:', err);
      setInternalAiReport(fallbackReport);
      onSaveAiReport?.(fallbackReport);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

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
  const wasteCounts = countWastes(steps);
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    let md = `# 📊 DOSSIÊ EXECUTIVO DE MAPEAMENTO DE FLUXO DE VALOR (VSM)\n\n`;
    md += `**Projeto**: ${projectName}\n`;
    md += `**Departamento / Área**: ${department}\n`;
    md += `**Organização**: ${companyName}\n`;
    md += `**Facilitador / Consultor Lean**: ${consultantName}\n`;
    md += `**Data da Sessão**: ${todayFormatted}\n`;
    md += `**Versão**: ${reportVersion}\n`;
    md += `**Maturidade Lean**: ${diagnosticReport.maturityScore}/100 (${diagnosticReport.maturityLabel})\n\n`;
    md += `---\n\n`;

    md += `## 1. Sumário Executivo & Diagnóstico Geral\n\n`;
    md += `${diagnosticReport.executiveSummary}\n\n`;

    md += `### Insights Estratégicos:\n`;
    diagnosticReport.keyInsights.forEach(i => {
      md += `- ${i}\n`;
    });
    md += `\n---\n\n`;

    md += `## 2. Painel de Indicadores Mestres de Fluxo (Lean KPIs)\n\n`;
    md += `| Indicador | Valor Obtido | Benchmark Lean & Interpretação |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Lead Time Total (LT)** | **${formatHours(totalLeadTimeHours)}** (~${(totalLeadTimeHours / 8).toFixed(1)} dias úteis) | Tempo total do pedido até a entrega final |\n`;
    md += `| **Tempo de Esforço Ativo (PT)** | **${formatHours(totalProcessHours)}** | Tempo efetivo com valor agregado real |\n`;
    md += `| **Tempo de Fila / Espera (WT)** | **${formatHours(totalWaitHours)}** (${((totalWaitHours / totalLeadTimeHours) * 100).toFixed(1)}% do LT) | Tempo morto onde a tarefa fica ociosa em caixas de entrada |\n`;
    md += `| **Eficiência de Fluxo (FE)** | **${flowEfficiency.toFixed(1)}%** | ${efficiencyMeta.label} (Meta Classe Mundial: > 25%) |\n`;
    md += `| **Rolled First Pass Yield (%C&A)** | **${overallYield.toFixed(1)}%** | Rendimento sem retrabalho (Taxa de devoluções: ${(100 - overallYield).toFixed(1)}%) |\n\n`;
    md += `---\n\n`;

    if (includeEducation) {
      md += `## 3. Caderno Metodológico & Guia Educativo Lean\n\n`;
      md += `### Por que mapear o VSM em Processos Administrativos e de RH?\n`;
      md += `No chão de fábrica, o inventário é visível (pilhas de peças). No escritório e no RH, o inventário é invisível: acumula-se silenciosamente em caixas de e-mail, chamados parados em sistemas e solicitações esperando parecer.\n\n`;
      md += `### A Lei das Filas (Lead Time vs Process Time):\n`;
      md += `O tempo real de trabalho (PT) geralmente representa menos de 5% do Lead Time. Acelerar quem está trabalhando economiza minutos; eliminar o tempo que o chamado fica parado na fila (WT) economiza dias.\n\n`;
      md += `### O Efeito Cascata do Retrabalho (%C&A):\n`;
      md += `O %C&A (% Completo e Acurado) mede quantas vezes a informação chega correta na primeira vez. Em uma cadeia de etapas, pequenas falhas multiplicam o retrabalho e destroem a capacidade produtiva.\n\n`;
      md += `---\n\n`;
    }

    if (includeBottlenecks) {
      md += `## 4. Raio-X dos Gargalos Críticos do Processo\n\n`;
      if (diagnosticReport.bottleneckAnalysis.waitBottleneck) {
        const wb = diagnosticReport.bottleneckAnalysis.waitBottleneck;
        md += `### 🔴 Maior Gargalo de Fila / Lead Time:\n`;
        md += `- **Etapa**: ${wb.stepTitle} (${wb.role})\n`;
        md += `- **Tempo em Fila**: ${wb.waitTimeHours.toFixed(1)} horas (~${(wb.waitTimeHours / 8).toFixed(1)} dias úteis), representando ${wb.percentageOfLeadTime.toFixed(1)}% de todo o Lead Time do processo.\n`;
        md += `- **Impacto**: ${wb.impact}\n`;
        md += `- **Causas Raiz Típicas**: ${wb.rootCauses.join(', ')}\n\n`;
      }
      if (diagnosticReport.bottleneckAnalysis.qualityBottleneck) {
        const qb = diagnosticReport.bottleneckAnalysis.qualityBottleneck;
        md += `### ⚠️ Maior Gargalo de Qualidade e Retrabalho (%C&A):\n`;
        md += `- **Etapa**: ${qb.stepTitle} (${qb.role})\n`;
        md += `- **Acurácia na 1ª Vez**: ${qb.accuracy}% (${100 - qb.accuracy}% de devoluções/retrabalho)\n`;
        md += `- **Impacto**: ${qb.impact}\n`;
        md += `- **Causas Raiz Típicas**: ${qb.rootCauses.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    }

    if (includeTable) {
      md += `## 5. Matriz Técnica Auditável de Etapas\n\n`;
      md += `| # | Etapa | Responsável | PT (Trabalho) | WT (Fila) | %C&A | Desperdícios Identificados | Oportunidades Kaizen |\n`;
      md += `| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |\n`;
      steps.forEach(s => {
        const wastes = s.wasteTypes?.map(w => WASTE_METAS[w]?.shortLabel).join(', ') || 'Nenhum';
        const kaizen = s.kaizenNotes || '-';
        md += `| ${s.order} | ${s.title} | ${s.role} | ${s.processTime} ${s.processTimeUnit} | ${s.waitTime} ${s.waitTimeUnit} | ${s.percentCompleteAndAccurate}% | ${wastes} | ${kaizen} |\n`;
      });
      md += `\n---\n\n`;
    }

    if (includeSimulation) {
      md += `## 6. Projeção de Estado Futuro (Antes vs Depois)\n\n`;
      const fs = diagnosticReport.futureStateSimulation;
      md += `| Dimensão Analisada | Estado Atual (As-Is) | Estado Futuro Projetado (To-Be) | Ganho Estimado |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      md += `| **Lead Time Ponta a Ponta** | ${(fs.currentLeadTimeHours / 8).toFixed(1)} dias úteis (${fs.currentLeadTimeHours.toFixed(1)}h) | **~${(fs.projectedLeadTimeHours / 8).toFixed(1)} dias úteis** (${fs.projectedLeadTimeHours.toFixed(1)}h) | **-${fs.leadTimeReductionPercent}% de redução** |\n`;
      md += `| **Eficiência de Fluxo (FE)** | ${fs.currentFlowEfficiency.toFixed(1)}% | **${fs.projectedFlowEfficiency.toFixed(1)}%** | **+${Math.round(fs.projectedFlowEfficiency - fs.currentFlowEfficiency)} pontos percentuais** |\n`;
      md += `| **Rendimento Rolled Yield (%C&A)** | ${fs.currentYield.toFixed(1)}% | **${fs.projectedYield}%** | **Eliminação massiva de devoluções** |\n\n`;
      md += `---\n\n`;
    }

    if (includeRoadmap) {
      md += `## 7. Roadmap Kaizen de Implementação (30 - 60 - 90 Dias)\n\n`;
      md += `### Fase 1: Vitórias Rápidas (0 a 30 dias - Quick Wins)\n`;
      diagnosticReport.actionRoadmap.quickWins.forEach(a => {
        md += `- **${a.action}** [Impacto: ${a.impact} | Esforço: ${a.effort} | Foco: ${a.targetStep}]\n`;
      });
      md += `\n### Fase 2: Melhorias Estruturais & Padronização (30 a 60 dias)\n`;
      diagnosticReport.actionRoadmap.structuralImprovements.forEach(a => {
        md += `- **${a.action}** [Impacto: ${a.impact} | Esforço: ${a.effort} | Foco: ${a.targetStep}]\n`;
      });
      md += `\n### Fase 3: Automação & Transformação Digital (60 a 90 dias)\n`;
      diagnosticReport.actionRoadmap.automationProjects.forEach(a => {
        md += `- **${a.action}** [Impacto: ${a.impact} | Esforço: ${a.effort} | Foco: ${a.targetStep}]\n`;
      });
      md += `\n---\n\n`;
    }

    if (includeSignatures) {
      md += `## 8. Termo de Aprovação & Governança Executiva\n\n`;
      md += `As lideranças e a consultoria Lean Six Sigma validam os achados e o plano de ação acima discriminados:\n\n`;
      md += `- **Patrocinador Executivo (Sponsor)**: _______________________________ Data: ____/____/________\n`;
      md += `- **Dono do Processo (Process Owner)**: _______________________________ Data: ____/____/________\n`;
      md += `- **Consultor / Facilitador Lean**: ${consultantName} __________________ Data: ____/____/________\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isPaper = viewMode === 'paper';

  return (
    <div
      id="vsm-print-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* ================================================================= */}
        {/* TOP INTERACTIVE TOOLBAR (ALWAYS HIDDEN IN @media print)           */}
        {/* ================================================================= */}
        <div className="no-print p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95">
          
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                  Dossiê Executivo & Relatório Lean
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                  Pronto para Impressão / PDF
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {projectName} • {department}
              </span>
            </div>
          </div>

          {/* Controls: View Mode Toggle + Config + Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* View Mode Switch */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setViewMode('paper')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isPaper
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizar exatamente como será impresso em papel A4 branco"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Folha A4 (Papel)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isPaper
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Tema Escuro Executivo"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Modo Tela (Dark)</span>
              </button>
            </div>

            {/* Config Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showConfig
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Personalizar seções e metadados antes de imprimir"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personalizar</span>
            </button>

            {/* Copy Markdown Button */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
              title="Copiar relatório completo formatado em Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar MD'}</span>
            </button>

            {/* Print / Save to PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              title="Abrir diálogo de impressão / Salvar como PDF em A4"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* ================================================================= */}
        {/* REPORT SETTINGS & METADATA ACCORDION (NO-PRINT)                   */}
        {/* ================================================================= */}
        {showConfig && (
          <div className="no-print p-4 bg-slate-900 border-b border-slate-800 text-xs space-y-3 animate-in slide-in-from-top duration-200">
            <span className="text-[11px] font-bold uppercase font-mono text-cyan-400 block tracking-wider">
              Configurações de Emissão do Dossiê & Seções
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block font-mono mb-1">Consultor / Facilitador Lean:</label>
                <input
                  type="text"
                  value={consultantName}
                  onChange={e => setConsultantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Nome do consultor..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-mono mb-1">Empresa / Unidade:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Nome da empresa..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-mono mb-1">Identificação da Versão:</label>
                <input
                  type="text"
                  value={reportVersion}
                  onChange={e => setReportVersion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Versão..."
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-slate-300">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Incluir no Dossiê:</span>
              
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEducation}
                  onChange={e => setIncludeEducation(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Caderno Educativo Lean</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBottlenecks}
                  onChange={e => setIncludeBottlenecks(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Raio-X dos Gargalos</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTable}
                  onChange={e => setIncludeTable(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Matriz Completa de Etapas</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSimulation}
                  onChange={e => setIncludeSimulation(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Simulação Antes vs Depois</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRoadmap}
                  onChange={e => setIncludeRoadmap(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Roadmap Kaizen 30-60-90</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={e => setIncludeSignatures(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Assinaturas & Governança</span>
              </label>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* AI INTEGRATION STATUS BANNER (ALWAYS HIDDEN IN @media print)       */}
        {/* ================================================================= */}
        <div className="no-print px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          {isGeneratingAi ? (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 animate-pulse">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>
                  <strong>Inteligência Artificial Ativa:</strong> Analisando tempos de ciclo, filas e causas-raiz para consolidar o parecer executivo do dossiê...
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300">Processando...</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Dossiê Completo com Parecer IA:</strong> Analisado e emitido via <strong className="text-white font-mono">{diagnosticReport.provider || 'Inteligência Artificial'}</strong> ({diagnosticReport.isLiveAi ? 'Ao Vivo' : 'Motor Especialista'}).
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFetchAi}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 cursor-pointer"
                title="Recalcular diagnóstico com a IA"
              >
                Recalcular IA
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* DOSSIER BODY (PRINT READY CONTAINER: #vsm-printable-dossier)       */}
        {/* ================================================================= */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 md:p-10 transition-colors ${
            isPaper
              ? 'bg-slate-200 text-slate-900'
              : 'bg-slate-950 text-slate-100'
          }`}
        >
          {/* Centered A4 Page Simulation container */}
          <div
            id="vsm-printable-dossier"
            className={`mx-auto transition-all ${
              isPaper
                ? 'max-w-4xl bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-12 border border-slate-300 space-y-8'
                : 'max-w-4xl space-y-8'
            }`}
          >

            {/* ------------------------------------------------------------- */}
            {/* 1. OFFICIAL COVER / EXECUTIVE HEADER                          */}
            {/* ------------------------------------------------------------- */}
            <div className={`border-b pb-6 ${isPaper ? 'border-slate-300' : 'border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                      VSM
                    </div>
                    <span className="text-xs uppercase font-bold tracking-widest font-mono text-cyan-600 dark:text-cyan-400">
                      Lean Six Sigma Executive Dossier
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight leading-snug">
                    {projectName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>{department}</span>
                    </span>
                    <span>•</span>
                    <span>{companyName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{todayFormatted}</span>
                    </span>
                  </div>
                </div>

                {/* Lean Maturity Badge */}
                <div className={`p-4 rounded-2xl border text-center sm:text-right min-w-[200px] ${
                  isPaper
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold font-mono text-slate-500 block">
                    Maturidade Lean do Processo
                  </span>
                  <div className="flex items-center justify-center sm:justify-end gap-2 mt-1">
                    <Award className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                      {diagnosticReport.maturityScore}
                    </span>
                    <span className="text-xs font-mono text-slate-400">/100</span>
                  </div>
                  <span className="text-xs font-bold block mt-1 text-slate-800 dark:text-slate-200">
                    {diagnosticReport.maturityLabel}
                  </span>
                </div>

              </div>

              {/* Dossier Meta Sub-Bar */}
              <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 ${
                isPaper ? 'border-slate-200' : 'border-slate-800/80'
              }`}>
                <span><strong>Facilitador:</strong> {consultantName}</span>
                <span><strong>Versão:</strong> {reportVersion}</span>
                <span><strong>Parecer Técnico:</strong> {diagnosticReport.provider || 'Motor Especialista Lean'}</span>
                <span><strong>Etapas:</strong> {steps.length} mapeadas</span>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. EXECUTIVE SUMMARY & VERDICT                                */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                  1. Sumário Executivo & Diagnóstico da Consultoria
                </h2>
              </div>

              <div className={`p-5 rounded-2xl border leading-relaxed text-xs sm:text-sm ${
                isPaper
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}>
                <p className="font-medium">
                  {diagnosticReport.executiveSummary}
                </p>

                {diagnosticReport.keyInsights.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold uppercase font-mono text-cyan-700 dark:text-cyan-400 block">
                      Principais Achados da Dinâmica:
                    </span>
                    <ul className="grid grid-cols-1 gap-2 text-xs">
                      {diagnosticReport.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 3. LEAN KPI DASHBOARD & BENCHMARKS                            */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 print-avoid-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    2. Painel de Indicadores Chave de Fluxo Enxuto (Lean KPIs)
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  Regra PT vs WT • Eficiência de Fluxo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Lead Time */}
                <div className={`p-4 rounded-2xl border ${
                  isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                    Lead Time Total (LT)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                    {formatHours(totalLeadTimeHours)}
                  </span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium block mt-0.5">
                    ~{(totalLeadTimeHours / 8).toFixed(1)} dias úteis
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Do gatilho inicial até a entrega
                  </span>
                </div>

                {/* Process Time */}
                <div className={`p-4 rounded-2xl border ${
                  isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                    Tempo de Trabalho (PT)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
                    {formatHours(totalProcessHours)}
                  </span>
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono font-medium block mt-0.5">
                    ~{(totalProcessHours / 8).toFixed(1)} dias úteis
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Tempo ativo agregando valor
                  </span>
                </div>

                {/* Flow Efficiency */}
                <div className={`p-4 rounded-2xl border ${
                  isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                    Eficiência de Fluxo
                  </span>
                  <span className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${
                    flowEfficiency >= 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {flowEfficiency.toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium block mt-0.5">
                    {efficiencyMeta.label}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Benchmark Mundial: &gt; 25%
                  </span>
                </div>

                {/* Rolled Yield */}
                <div className={`p-4 rounded-2xl border ${
                  isPaper ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                    Rendimento Rolled Yield
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1 block">
                    {overallYield.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono font-medium block mt-0.5">
                    {(100 - overallYield).toFixed(1)}% retrabalho
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Multiplicação dos %C&A
                  </span>
                </div>

              </div>

              {/* Interpretation Bar */}
              <div className={`p-3 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-2 border ${
                isPaper ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}>
                <span>
                  <strong>Diagnóstico de Ociosidade:</strong> O processo passa <strong>{((totalWaitHours / totalLeadTimeHours) * 100).toFixed(1)}%</strong> do tempo total estagnado em filas e caixas de entrada (WT: {formatHours(totalWaitHours)}).
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  {flowEfficiency < 5 ? 'Alavanca Lean: Eliminação de Filas Imediata' : 'Fluxo com Boa Tração'}
                </span>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4. EDUCATIONAL / PEDAGOGICAL SECTION (TRAINING GUIDE)         */}
            {/* ------------------------------------------------------------- */}
            {includeEducation && (
              <div className="space-y-4 print-page-break">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    3. Caderno Metodológico & Guia Educativo Lean Six Sigma
                  </h2>
                </div>

                <div className={`p-6 rounded-2xl border space-y-5 text-xs ${
                  isPaper
                    ? 'bg-cyan-50/40 border-cyan-200 text-slate-800'
                    : 'bg-cyan-950/20 border-cyan-500/30 text-slate-200'
                }`}>
                  
                  {/* Topic 1: VSM in Office & HR */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase font-mono text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <span>•</span>
                      <span>Por que mapear o VSM em Processos Administrativos e de RH?</span>
                    </h3>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                      No chão de fábrica industrial, o estoque e os gargalos são físicos: pilhas de peças visíveis no galpão. 
                      Nos processos corporativos e de RH, o inventário é <strong>invisível</strong>: acumula-se silenciosamente em caixas de entrada de e-mail, planilhas descentralizadas, requisições paradas em sistemas ERP/ATS e mensagens sem resposta. O VSM torna esse fluxo visível e quantificável.
                    </p>
                  </div>

                  {/* Topic 2: Lead Time vs Process Time */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase font-mono text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <span>•</span>
                      <span>A Diferença Crítica: Lead Time (LT) versus Process Time (PT)</span>
                    </h3>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                      <strong>Lead Time (LT)</strong> é o tempo total que o cliente ou requisitante aguarda da abertura até a conclusão. 
                      <strong>Process Time (PT)</strong> é o tempo em que o colaborador está de fato operando a tarefa. 
                      A armadilha clássica da gestão tradicional é cobrar que o time trabalhe mais rápido (tentando reduzir minutos de PT), quando na verdade mais de <strong>90% do tempo</strong> é gasto com o chamado parado na fila de espera (WT) esperando alguém abrir ou aprovar. O foco do Lean é <strong>eliminar a fila</strong>.
                    </p>
                  </div>

                  {/* Topic 3: %C&A and Rolled Yield */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase font-mono text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                      <span>•</span>
                      <span>O Efeito Bola de Neve do Retrabalho (%C&A e Rolled First Pass Yield)</span>
                    </h3>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                      O indicador <strong>%C&A (% Completo e Acurado)</strong> mede se a etapa recebeu todas as informações certas e completas na primeira tentativa, sem precisar devolver, tirar dúvidas ou cobrar anexos. 
                      O <strong>Rolled First Pass Yield</strong> multiplica a acurácia de todas as etapas: se 5 etapas tiverem 85% de C&A cada, o rendimento final do processo sem retrabalho é de apenas <strong>(0.85)⁵ = 44%</strong>. Ou seja, mais da metade dos processos sofre devoluções invisíveis que sobrecarregam a equipe.
                    </p>
                  </div>

                  {/* Topic 4: TIMWOODS Table */}
                  <div className="space-y-2 pt-2 border-t border-cyan-200 dark:border-cyan-500/20">
                    <h3 className="text-xs font-bold uppercase font-mono text-cyan-800 dark:text-cyan-300">
                      Os 8 Desperdícios Lean (TIMWOODS) Adaptados para Escritório & RH:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>T - Transporte:</strong> Enviar dados por múltiplos e-mails ou copiar arquivos em 3 pastas de rede.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>I - Inventário:</strong> Dezenas de vagas sem triagem ou solicitações acumuladas na caixa de entrada.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>M - Movimentação:</strong> Alternar entre 5 softwares e abas do navegador para preencher uma ficha.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>W - Espera (Wait):</strong> Aguardar 3 dias pela assinatura ou aprovação de um gestor ausente.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>O - Superprodução:</strong> Gerar relatórios densos que ninguém lê ou duplicar controles em planilhas.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>O - Sobreprocessamento:</strong> Múltiplas validações redundantes para pedidos de baixo risco/valor.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>D - Defeitos / Retrabalho:</strong> Formulários com dados incompletos ou erros de cadastro cadastrais.
                      </div>
                      <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <strong>S - Habilidades Subutilizadas:</strong> Analistas seniores fazendo digitação mecânica repetitiva.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. DEEP DIVE BOTTLENECKS DIAGNOSIS                            */}
            {/* ------------------------------------------------------------- */}
            {includeBottlenecks && (
              <div className="space-y-4 print-avoid-break">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    4. Raio-X Detalhado dos Gargalos Críticos
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Wait Bottleneck */}
                  {diagnosticReport.bottleneckAnalysis.waitBottleneck && (
                    <div className={`p-5 rounded-2xl border space-y-3 ${
                      isPaper
                        ? 'bg-amber-50/60 border-amber-300 text-slate-900'
                        : 'bg-amber-950/20 border-amber-500/30 text-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                          WT
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block font-mono">
                            Maior Gargalo de Fila / Lead Time
                          </span>
                          <h3 className="text-sm font-bold">
                            {diagnosticReport.bottleneckAnalysis.waitBottleneck.stepTitle}
                          </h3>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <div className="flex justify-between border-b pb-1 border-amber-200 dark:border-amber-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Responsável:</span>
                          <strong>{diagnosticReport.bottleneckAnalysis.waitBottleneck.role}</strong>
                        </div>
                        <div className="flex justify-between border-b pb-1 border-amber-200 dark:border-amber-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Tempo em Espera:</span>
                          <strong className="text-amber-700 dark:text-amber-400">
                            {diagnosticReport.bottleneckAnalysis.waitBottleneck.waitTimeHours.toFixed(1)} horas (~{(diagnosticReport.bottleneckAnalysis.waitBottleneck.waitTimeHours / 8).toFixed(1)}d)
                          </strong>
                        </div>
                        <div className="flex justify-between border-b pb-1 border-amber-200 dark:border-amber-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">% do Lead Time Total:</span>
                          <strong>{diagnosticReport.bottleneckAnalysis.waitBottleneck.percentageOfLeadTime.toFixed(1)}%</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Impacto Operacional:</strong> {diagnosticReport.bottleneckAnalysis.waitBottleneck.impact}
                      </p>

                      <div className="text-[11px] pt-1">
                        <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">Causas Raiz Mais Frequentes:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                          {diagnosticReport.bottleneckAnalysis.waitBottleneck.rootCauses.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Quality Bottleneck */}
                  {diagnosticReport.bottleneckAnalysis.qualityBottleneck && (
                    <div className={`p-5 rounded-2xl border space-y-3 ${
                      isPaper
                        ? 'bg-rose-50/60 border-rose-300 text-slate-900'
                        : 'bg-rose-950/20 border-rose-500/30 text-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-rose-500 text-white font-bold text-xs">
                          %C&A
                        </span>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block font-mono">
                            Maior Ponto de Retrabalho / Qualidade
                          </span>
                          <h3 className="text-sm font-bold">
                            {diagnosticReport.bottleneckAnalysis.qualityBottleneck.stepTitle}
                          </h3>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5">
                        <div className="flex justify-between border-b pb-1 border-rose-200 dark:border-rose-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Responsável:</span>
                          <strong>{diagnosticReport.bottleneckAnalysis.qualityBottleneck.role}</strong>
                        </div>
                        <div className="flex justify-between border-b pb-1 border-rose-200 dark:border-rose-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Acurácia na 1ª Vez (%C&A):</span>
                          <strong className="text-rose-700 dark:text-rose-400">
                            {diagnosticReport.bottleneckAnalysis.qualityBottleneck.accuracy}%
                          </strong>
                        </div>
                        <div className="flex justify-between border-b pb-1 border-rose-200 dark:border-rose-500/20 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">Taxa de Devolução / Erro:</span>
                          <strong>{100 - diagnosticReport.bottleneckAnalysis.qualityBottleneck.accuracy}%</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Impacto Operacional:</strong> {diagnosticReport.bottleneckAnalysis.qualityBottleneck.impact}
                      </p>

                      <div className="text-[11px] pt-1">
                        <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1">Causas Raiz Mais Frequentes:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                          {diagnosticReport.bottleneckAnalysis.qualityBottleneck.rootCauses.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. AUDITABLE STEP MATRIX (TABLE)                              */}
            {/* ------------------------------------------------------------- */}
            {includeTable && (
              <div className="space-y-3 print-page-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                      5. Matriz Auditável de Etapas do Fluxo de Valor
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    {steps.length} etapas mapeadas
                  </span>
                </div>

                <div className={`overflow-x-auto border rounded-2xl ${
                  isPaper ? 'border-slate-300 bg-white' : 'border-slate-800 bg-slate-900/60'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className={`text-[10px] uppercase font-bold font-mono border-b ${
                      isPaper ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      <tr>
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">Nome da Etapa</th>
                        <th className="p-2.5">Responsável (Papel)</th>
                        <th className="p-2.5 text-right whitespace-nowrap">PT (Trabalho)</th>
                        <th className="p-2.5 text-right whitespace-nowrap">WT (Fila)</th>
                        <th className="p-2.5 text-right whitespace-nowrap">%C&A</th>
                        <th className="p-2.5">Desperdícios</th>
                        <th className="p-2.5">Oportunidade Kaizen</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isPaper ? 'divide-slate-200' : 'divide-slate-800/60'
                    }`}>
                      {steps.map(step => (
                        <tr key={step.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-2.5 text-center font-bold text-cyan-600 dark:text-cyan-400">
                            #{step.order}
                          </td>
                          <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white max-w-[200px]">
                            {step.title}
                          </td>
                          <td className="p-2.5 font-sans text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {step.role}
                          </td>
                          <td className="p-2.5 text-right text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                            {step.processTime} {step.processTimeUnit}
                          </td>
                          <td className="p-2.5 text-right text-amber-700 dark:text-amber-400 whitespace-nowrap">
                            {step.waitTime} {step.waitTimeUnit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                            {step.percentCompleteAndAccurate}%
                          </td>
                          <td className="p-2.5 font-sans text-[11px] text-slate-500 dark:text-slate-400">
                            {step.wasteTypes?.map(w => WASTE_METAS[w]?.shortLabel).join(', ') || '-'}
                          </td>
                          <td className="p-2.5 font-sans text-[11px] text-amber-700 dark:text-amber-300 max-w-[180px]">
                            {step.kaizenNotes ? `💡 ${step.kaizenNotes}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={`border-t font-mono text-[11px] font-bold ${
                      isPaper ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}>
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right uppercase">Totais Auditados:</td>
                        <td className="p-2.5 text-right text-cyan-700 dark:text-cyan-400">{formatHours(totalProcessHours)}</td>
                        <td className="p-2.5 text-right text-amber-700 dark:text-amber-400">{formatHours(totalWaitHours)}</td>
                        <td className="p-2.5 text-right text-purple-700 dark:text-purple-400">{overallYield.toFixed(1)}% (RFPY)</td>
                        <td colSpan={2} className="p-2.5 text-slate-500 font-sans font-normal">
                          Lead Time Total: {formatHours(totalLeadTimeHours)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. FUTURE STATE SIMULATION (BEFORE VS AFTER)                  */}
            {/* ------------------------------------------------------------- */}
            {includeSimulation && (
              <div className="space-y-4 print-avoid-break">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    6. Visão do Estado Futuro Enxuto (Antes vs Depois)
                  </h2>
                </div>

                <div className={`p-6 rounded-2xl border space-y-4 ${
                  isPaper
                    ? 'bg-emerald-50/40 border-emerald-300 text-slate-900'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-slate-100'
                }`}>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {diagnosticReport.futureStateSimulation.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    
                    {/* Lead Time Reduction */}
                    <div className={`p-4 rounded-xl border ${
                      isPaper ? 'bg-white border-emerald-200' : 'bg-slate-900 border-emerald-500/20'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                        Redução de Lead Time
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          -{diagnosticReport.futureStateSimulation.leadTimeReductionPercent}%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block mt-1">
                        De {(diagnosticReport.futureStateSimulation.currentLeadTimeHours / 8).toFixed(1)}d para <strong>~{(diagnosticReport.futureStateSimulation.projectedLeadTimeHours / 8).toFixed(1)} dias úteis</strong>
                      </span>
                    </div>

                    {/* Flow Efficiency Boost */}
                    <div className={`p-4 rounded-xl border ${
                      isPaper ? 'bg-white border-emerald-200' : 'bg-slate-900 border-emerald-500/20'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                        Salto na Eficiência de Fluxo
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                          {diagnosticReport.futureStateSimulation.projectedFlowEfficiency.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block mt-1">
                        De {diagnosticReport.futureStateSimulation.currentFlowEfficiency.toFixed(1)}% (+{Math.round(diagnosticReport.futureStateSimulation.projectedFlowEfficiency - diagnosticReport.futureStateSimulation.currentFlowEfficiency)} pontos percentuais)
                      </span>
                    </div>

                    {/* Rolled Yield Boost */}
                    <div className={`p-4 rounded-xl border ${
                      isPaper ? 'bg-white border-emerald-200' : 'bg-slate-900 border-emerald-500/20'
                    }`}>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">
                        Rendimento sem Retrabalho
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                          {diagnosticReport.futureStateSimulation.projectedYield}%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block mt-1">
                        De {diagnosticReport.futureStateSimulation.currentYield.toFixed(1)}% através de checklists na origem
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 8. KAIZEN ROADMAP 30-60-90 DAYS                               */}
            {/* ------------------------------------------------------------- */}
            {includeRoadmap && (
              <div className="space-y-4 print-page-break">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    7. Roadmap de Implementação Kaizen (30 - 60 - 90 Dias)
                  </h2>
                </div>

                <div className="space-y-3">
                  
                  {/* Quick Wins (0 to 30 days) */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    isPaper ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px]">0 a 30 dias</span>
                        <span>Vitórias Rápidas (Quick Wins) • Sem Investimento / Baixo Esforço</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {diagnosticReport.actionRoadmap.quickWins.map((q, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                            isPaper ? 'bg-white border-emerald-100 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold block">{q.action}</span>
                            <span className="text-[11px] text-slate-500">Etapa Alvo: <strong>{q.targetStep}</strong></span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] shrink-0 font-mono">
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{q.impact}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Esforço: {q.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Structural Improvements (30 to 60 days) */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    isPaper ? 'bg-cyan-50/50 border-cyan-200' : 'bg-cyan-950/20 border-cyan-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-600 text-white text-[10px]">30 a 60 dias</span>
                        <span>Melhorias Estruturais • Padronização & Acordos de SLA</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {diagnosticReport.actionRoadmap.structuralImprovements.map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                            isPaper ? 'bg-white border-cyan-100 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold block">{s.action}</span>
                            <span className="text-[11px] text-slate-500">Etapa Alvo: <strong>{s.targetStep}</strong></span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] shrink-0 font-mono">
                            <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{s.impact}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Esforço: {s.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Automation & Digital Transformation (60 to 90 days) */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${
                    isPaper ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px]">60 a 90 dias</span>
                        <span>Automações de Processo & Transformação Digital</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {diagnosticReport.actionRoadmap.automationProjects.map((a, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                            isPaper ? 'bg-white border-purple-100 text-slate-900' : 'bg-slate-900/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold block">{a.action}</span>
                            <span className="text-[11px] text-slate-500">Etapa Alvo: <strong>{a.targetStep}</strong></span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] shrink-0 font-mono">
                            <span className="text-purple-700 dark:text-purple-400 font-semibold">{a.impact}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Esforço: {a.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 9. FORMAL APPROVAL & GOVERNANCE SIGN-OFFS                     */}
            {/* ------------------------------------------------------------- */}
            {includeSignatures && (
              <div className="space-y-4 print-avoid-break pt-4 border-t border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <h2 className="text-sm uppercase font-bold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                    8. Termo de Aprovação & Governança Executiva
                  </h2>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  As partes abaixo assinadas declaram haver participado da dinâmica de Mapeamento do Fluxo de Valor (VSM) e validam as métricas apuradas, os gargalos identificados e o plano de ação Kaizen estipulado para a transformação do processo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
                  
                  {/* Sponsor */}
                  <div className="space-y-2">
                    <div className="border-b-2 border-slate-400 dark:border-slate-700 pb-1 h-8"></div>
                    <span className="font-bold block text-slate-900 dark:text-white">Patrocinador do Projeto (Sponsor)</span>
                    <span className="text-[11px] text-slate-500 block font-mono">Diretoria / Gerência Executiva</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Data: ____/____/________</span>
                  </div>

                  {/* Process Owner */}
                  <div className="space-y-2">
                    <div className="border-b-2 border-slate-400 dark:border-slate-700 pb-1 h-8"></div>
                    <span className="font-bold block text-slate-900 dark:text-white">Dono do Processo (Process Owner)</span>
                    <span className="text-[11px] text-slate-500 block font-mono">Liderança Operacional</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Data: ____/____/________</span>
                  </div>

                  {/* Consultant */}
                  <div className="space-y-2">
                    <div className="border-b-2 border-slate-400 dark:border-slate-700 pb-1 h-8"></div>
                    <span className="font-bold block text-slate-900 dark:text-white">{consultantName}</span>
                    <span className="text-[11px] text-slate-500 block font-mono">Consultor / Especialista Lean</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Data: {todayFormatted}</span>
                  </div>

                </div>

                {/* Footer Micro-print */}
                <div className="pt-6 text-center text-[10px] font-mono text-slate-400 dark:text-slate-600">
                  Gerado pelo Sistema QualiDecision VSM Lean Canvas • Metodologia Lean Six Sigma para Processos Administrativos e Corporativos
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM MODAL FOOTER (ALWAYS HIDDEN IN @media print)               */}
        {/* ================================================================= */}
        <div className="no-print p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado em Markdown!' : 'Copiar Dossiê (Markdown)'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>

        </div>

      </div>
    </div>
  );
};
