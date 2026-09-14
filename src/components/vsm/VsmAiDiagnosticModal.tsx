'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Copy,
  Printer,
  RotateCcw,
  Check,
  Bot,
  BrainCircuit,
  Sliders,
  Award,
  Layers,
  Lightbulb
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import { generateVsmAiDiagnostic, AiDiagnosticReport } from '@/lib/vsmAiDiagnostic';

interface VsmAiDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  department: string;
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
}

export const VsmAiDiagnosticModal: React.FC<VsmAiDiagnosticModalProps> = ({
  isOpen,
  onClose,
  projectName,
  department,
  steps,
  metrics
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'bottlenecks' | 'futureState' | 'roadmap'>('summary');
  const [focusArea, setFocusArea] = useState<'all' | 'speed' | 'quality' | 'automation'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // AI Diagnostic Generation
  const report: AiDiagnosticReport = useMemo(() => {
    return generateVsmAiDiagnostic(projectName, department, steps, metrics, focusArea);
  }, [projectName, department, steps, metrics, focusArea]);

  // Simulation of AI thinking steps on open
  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setAnalysisStepIndex(0);

      const step1 = setTimeout(() => setAnalysisStepIndex(1), 350);
      const step2 = setTimeout(() => setAnalysisStepIndex(2), 700);
      const step3 = setTimeout(() => setAnalysisStepIndex(3), 1050);
      const finish = setTimeout(() => setIsAnalyzing(false), 1400);

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(finish);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const analysisSteps = [
    'Mapeando tempos de ciclo (PT) e filas de espera (WT)...',
    'Identificando restrições críticas e causas-raiz corporativas...',
    'Calculando impacto do retrabalho invisível (%C&A / Rolled Yield)...',
    'Projetando Estado Futuro Enxuto e roadmap Kaizen 30-60-90 dias...'
  ];

  // Copy full Markdown report
  const handleCopyMarkdown = () => {
    const md = `# Diagnóstico Executivo de VSM por Inteligência Artificial
**Projeto:** ${report.projectName} | **Área:** ${report.department}
**Data:** ${report.timestamp} | **Maturidade:** ${report.maturityScore}/100 (${report.maturityLabel})

---

## 1. Resumo Executivo
${report.executiveSummary}

### Principais Insights
${report.keyInsights.map(i => `- ${i}`).join('\n')}

---

## 2. Diagnóstico de Gargalos Críticos
${report.bottleneckAnalysis.waitBottleneck ? `### Gargalo de Espera (WT): ${report.bottleneckAnalysis.waitBottleneck.stepTitle} (${report.bottleneckAnalysis.waitBottleneck.role})
- **Tempo de Fila:** ${(report.bottleneckAnalysis.waitBottleneck.waitTimeHours / 8).toFixed(1)} dias úteis (${report.bottleneckAnalysis.waitBottleneck.percentageOfLeadTime}% do Lead Time total)
- **Impacto:** ${report.bottleneckAnalysis.waitBottleneck.impact}
- **Causas Raiz Prováveis:**
${report.bottleneckAnalysis.waitBottleneck.rootCauses.map(c => `  * ${c}`).join('\n')}` : ''}

${report.bottleneckAnalysis.qualityBottleneck ? `### Gargalo de Qualidade (%C&A): ${report.bottleneckAnalysis.qualityBottleneck.stepTitle} (${report.bottleneckAnalysis.qualityBottleneck.role})
- **%C&A:** ${report.bottleneckAnalysis.qualityBottleneck.accuracy}% (${report.bottleneckAnalysis.qualityBottleneck.reworkRisk})
- **Impacto:** ${report.bottleneckAnalysis.qualityBottleneck.impact}
- **Causas Raiz Prováveis:**
${report.bottleneckAnalysis.qualityBottleneck.rootCauses.map(c => `  * ${c}`).join('\n')}` : ''}

---

## 3. Simulação do Estado Futuro (Antes vs Depois)
- **Lead Time:** ${(report.futureStateSimulation.currentLeadTimeHours / 8).toFixed(1)}d ➔ ${(report.futureStateSimulation.projectedLeadTimeHours / 8).toFixed(1)}d (-${report.futureStateSimulation.leadTimeReductionPercent}%)
- **Eficiência de Fluxo:** ${report.futureStateSimulation.currentFlowEfficiency.toFixed(1)}% ➔ ${report.futureStateSimulation.projectedFlowEfficiency.toFixed(1)}%
- **Rendimento sem Retrabalho (RFPY):** ${report.futureStateSimulation.currentYield.toFixed(1)}% ➔ ${report.futureStateSimulation.projectedYield}%

---

## 4. Roadmap Kaizen Recomendado
### Quick Wins (Até 15 dias)
${report.actionRoadmap.quickWins.map(q => `- **${q.action}** [Impacto: ${q.impact}] (Alvo: ${q.targetStep})`).join('\n')}

### Melhorias Estruturais (30 a 60 dias)
${report.actionRoadmap.structuralImprovements.map(s => `- **${s.action}** [Impacto: ${s.impact}] (Alvo: ${s.targetStep})`).join('\n')}

### Automação & Tecnologia (60 a 90 dias)
${report.actionRoadmap.automationProjects.map(a => `- **${a.action}** [Impacto: ${a.impact}] (Alvo: ${a.targetStep})`).join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/70 via-slate-900 to-cyan-950/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-heading">
                  Diagnóstico com Inteligência Artificial
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono text-purple-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Lean Six Sigma AI</span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-sans">
                {projectName} • {department}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: AI Scanning Overlay OR Full Diagnostic Dashboard */}
        {isAnalyzing ? (
          <div className="p-12 flex flex-col items-center justify-center min-h-[420px] text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
                <Bot className="w-10 h-10 text-purple-400 animate-bounce" />
              </div>
              <div className="absolute inset-0 rounded-3xl ring-4 ring-purple-500/20 animate-ping" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-base font-bold text-white font-heading">
                O Consultor IA está processando seu VSM...
              </h3>
              <p className="text-xs text-purple-300 font-mono animate-pulse">
                {analysisSteps[analysisStepIndex]}
              </p>
            </div>

            {/* Simulated Progress Bar */}
            <div className="w-64 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${((analysisStepIndex + 1) / analysisSteps.length) * 100}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyzing(false)}
              className="text-[11px] text-slate-500 hover:text-slate-300 font-mono underline cursor-pointer"
            >
              Pular animação
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6 bg-[#060a13]">
            
            {/* Top Scorecard & Quick Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              
              {/* Score Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    Score de Maturidade Lean
                  </span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-white">
                    {report.maturityScore}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ 100</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border truncate ${report.maturityColor}`}>
                  {report.maturityLabel}
                </span>
              </div>

              {/* Lead Time Potential */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    Potencial de Redução
                  </span>
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-emerald-400">
                    -{report.futureStateSimulation.leadTimeReductionPercent}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">de Lead Time</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  De {(report.futureStateSimulation.currentLeadTimeHours / 8).toFixed(1)}d para ~{(report.futureStateSimulation.projectedLeadTimeHours / 8).toFixed(1)}d úteis
                </span>
              </div>

              {/* Flow Efficiency Gain */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    Eficiência de Fluxo
                  </span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="my-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">
                    {report.futureStateSimulation.currentFlowEfficiency.toFixed(1)}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {report.futureStateSimulation.projectedFlowEfficiency.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Valor agregado x tempo total
                </span>
              </div>

              {/* Quality & Yield */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    Rendimento sem Erros
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-white">
                    {report.futureStateSimulation.currentYield.toFixed(1)}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-2xl font-black font-mono text-purple-300">
                    {report.futureStateSimulation.projectedYield}%
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Efeito cumulativo %C&A (RFPY)
                </span>
              </div>

            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'summary'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📋 Parecer do Consultor & Insights
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('bottlenecks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'bottlenecks'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚨 Diagnóstico dos Gargalos & Causas Raiz
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('futureState')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'futureState'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Simulação Antes vs Depois
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('roadmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'roadmap'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎯 Roadmap Kaizen 30-60-90 Dias
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Parecer (MD)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Imprimir relatório"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              </div>
            </div>

            {/* TAB 1: SUMMARY & INSIGHTS */}
            {activeTab === 'summary' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white font-heading uppercase tracking-wider font-mono">
                      Veredito Executivo do Consultor IA
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {report.executiveSummary}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Constatações-Chave do Fluxo de Valor</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {report.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-300 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <p>{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Muda breakdown summary */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Desperdícios (Muda) Identificados no Mapeamento</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {report.mudaBreakdown.map(m => (
                      <div key={m.type} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{m.label}</span>
                          <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40">
                            {m.count} apontamento(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {m.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOTTLENECKS & ROOT CAUSES */}
            {activeTab === 'bottlenecks' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Wait Bottleneck */}
                {report.bottleneckAnalysis.waitBottleneck && (
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500 text-white">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-rose-300">
                            Restrição #1 de Tempo (Maior Fila de Espera - WT)
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {report.bottleneckAnalysis.waitBottleneck.stepTitle}
                          </h3>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs font-mono font-bold text-rose-300">
                        {report.bottleneckAnalysis.waitBottleneck.percentageOfLeadTime}% do Lead Time total
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>Impacto Operacional:</strong> {report.bottleneckAnalysis.waitBottleneck.impact}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block">
                        🔍 Diagnóstico de Causa Raiz pelo Consultor IA:
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {report.bottleneckAnalysis.waitBottleneck.rootCauses.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Quality Bottleneck */}
                {report.bottleneckAnalysis.qualityBottleneck && (
                  <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-purple-300">
                            Restrição de Qualidade & Retrabalho (Pior %C&A)
                          </span>
                          <h3 className="text-sm font-bold text-white">
                            {report.bottleneckAnalysis.qualityBottleneck.stepTitle}
                          </h3>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/50 text-xs font-mono font-bold text-purple-300">
                        {report.bottleneckAnalysis.qualityBottleneck.accuracy}% C&A ({report.bottleneckAnalysis.qualityBottleneck.reworkRisk})
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>Impacto Operacional:</strong> {report.bottleneckAnalysis.qualityBottleneck.impact}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400 block">
                        🔍 Diagnóstico de Causa Raiz pelo Consultor IA:
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {report.bottleneckAnalysis.qualityBottleneck.rootCauses.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. Effort Bottleneck */}
                {report.bottleneckAnalysis.effortBottleneck && (
                  <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500 text-slate-950">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
                          Maior Tempo de Esforço Manual (PT)
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {report.bottleneckAnalysis.effortBottleneck.stepTitle} • {report.bottleneckAnalysis.effortBottleneck.role}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300">
                      Esta etapa consome {report.bottleneckAnalysis.effortBottleneck.processTimeHours.toFixed(1)} horas de trabalho ativo do colaborador. Candidata principal para padronização de templates e inteligência artificial generativa de apoio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FUTURE STATE SIMULATION */}
            {activeTab === 'futureState' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Visão do Estado Futuro Enxuto (Future State)</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.futureStateSimulation.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current State vs Future State Visual Cards */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono uppercase font-bold">
                      Estado Atual (As-Is)
                    </span>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Lead Time Ponta a Ponta:</span>
                        <strong className="text-amber-400 font-mono">{(report.futureStateSimulation.currentLeadTimeHours / 8).toFixed(1)} dias úteis</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Eficiência de Fluxo:</span>
                        <strong className="text-rose-400 font-mono">{report.futureStateSimulation.currentFlowEfficiency.toFixed(1)}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Rendimento sem Retrabalho (%C&A):</span>
                        <strong className="text-purple-300 font-mono">{report.futureStateSimulation.currentYield.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/40 border-2 border-emerald-500/40 space-y-3 shadow-xl">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono uppercase font-bold">
                      Estado Futuro Projetado (To-Be)
                    </span>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Lead Time Otimizado:</span>
                        <strong className="text-emerald-400 font-mono">~{(report.futureStateSimulation.projectedLeadTimeHours / 8).toFixed(1)} dias úteis (-{report.futureStateSimulation.leadTimeReductionPercent}%)</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Eficiência de Fluxo:</span>
                        <strong className="text-cyan-400 font-mono">{report.futureStateSimulation.projectedFlowEfficiency.toFixed(1)}% (+{Math.round(report.futureStateSimulation.projectedFlowEfficiency - report.futureStateSimulation.currentFlowEfficiency)}pp)</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Rendimento sem Retrabalho:</span>
                        <strong className="text-purple-300 font-mono">{report.futureStateSimulation.projectedYield}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACTION ROADMAP */}
            {activeTab === 'roadmap' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Quick Wins */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                      Até 15 Dias
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Quick Wins (Ações Imediatas de Baixo Esforço & Alto Impacto)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {report.actionRoadmap.quickWins.map((q, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">{q.action}</span>
                          <span className="text-[11px] text-slate-400 block">{q.impact}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                            Esforço {q.effort}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {q.targetStep}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Structural Improvements */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/40">
                      30 a 60 Dias
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Melhorias Estruturais de Processo & Alçadas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {report.actionRoadmap.structuralImprovements.map((s, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">{s.action}</span>
                          <span className="text-[11px] text-slate-400 block">{s.impact}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                            Esforço {s.effort}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {s.targetStep}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Automation & AI Projects */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/40">
                      60 a 90 Dias
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Automação, OCR & Integração via Sistemas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {report.actionRoadmap.automationProjects.map((a, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white block">{a.action}</span>
                          <span className="text-[11px] text-slate-400 block">{a.impact}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                            Esforço {a.effort}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {a.targetStep}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Lean Six Sigma Diagnostic Engine v2.0 • BagTime Design System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer ml-auto"
          >
            Fechar Diagnóstico
          </button>
        </div>

      </div>
    </div>
  );
};
