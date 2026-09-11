'use client';

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import {
  formatHours,
  getFlowEfficiencyClassification,
  countWastes,
  WASTE_METAS,
  convertTimeToHours
} from '@/lib/vsmCalculations';

interface VsmSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  department: string;
  steps: VSMStep[];
  metrics: BottleneckAnalysis;
}

export const VsmSummaryReportModal: React.FC<VsmSummaryReportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  department,
  steps,
  metrics
}) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopyMarkdown = () => {
    let md = `# 📊 DIAGNÓSTICO LEAN: MAPEAMENTO DE FLUXO DE VALOR (VSM)\n\n`;
    md += `**Projeto**: ${projectName}\n`;
    md += `**Área / Departamento**: ${department}\n`;
    md += `**Data da Sessão**: ${new Date().toLocaleDateString('pt-BR')}\n`;
    md += `**Total de Etapas Mapeadas**: ${steps.length}\n\n`;

    md += `## 1. Indicadores Chave de Fluxo Enxuto (Lean KPIs)\n\n`;
    md += `| Indicador | Valor Calculado | Benchmarking Lean |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Lead Time Total (LT)** | ${formatHours(totalLeadTimeHours)} (${(totalLeadTimeHours / 8).toFixed(1)} dias úteis) | Tempo total de ponta a ponta |\n`;
    md += `| **Tempo de Esforço (PT)** | ${formatHours(totalProcessHours)} | Tempo real com valor agregado |\n`;
    md += `| **Tempo de Fila/Espera (WT)** | ${formatHours(totalWaitHours)} | Desperdício de tempo em fila |\n`;
    md += `| **Eficiência de Fluxo (FE)** | **${flowEfficiency.toFixed(1)}%** | ${efficiencyMeta.label} |\n`;
    md += `| **Rolled First Pass Yield (RFPY)** | **${overallYield.toFixed(1)}%** | Rendimento sem retrabalho |\n\n`;

    md += `## 2. Diagnóstico de Gargalos Críticos\n\n`;
    if (maxWaitStep) {
      md += `- **Gargalo Principal de Fila / Espera**: Etapa #${maxWaitStep.order} - *${maxWaitStep.title}* (${maxWaitStep.role}) com **${maxWaitStep.waitTime} ${maxWaitStep.waitTimeUnit}** de espera.\n`;
    }
    if (lowestAccuracyStep) {
      md += `- **Gargalo de Retrabalho / Qualidade**: Etapa #${lowestAccuracyStep.order} - *${lowestAccuracyStep.title}* com **${lowestAccuracyStep.percentCompleteAndAccurate}% de C&A** (${100 - lowestAccuracyStep.percentCompleteAndAccurate}% de devolução).\n\n`;
    }

    md += `## 3. Matriz Completa de Etapas\n\n`;
    md += `| # | Etapa | Responsável | PT (Esforço) | WT (Espera) | %C&A | Desperdícios |\n`;
    md += `| :---: | :--- | :--- | :---: | :---: | :---: | :--- |\n`;
    steps.forEach(s => {
      const wastes = s.wasteTypes?.map(w => WASTE_METAS[w]?.shortLabel).join(', ') || '-';
      md += `| ${s.order} | ${s.title} | ${s.role} | ${s.processTime} ${s.processTimeUnit} | ${s.waitTime} ${s.waitTimeUnit} | ${s.percentCompleteAndAccurate}% | ${wastes} |\n`;
    });

    const kaizens = steps.filter(s => s.kaizenNotes);
    if (kaizens.length > 0) {
      md += `\n## 4. Plano de Ação Kaizen Bursts\n\n`;
      kaizens.forEach(s => {
        md += `- **Etapa #${s.order} (${s.title})**: ${s.kaizenNotes}\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">
                Relatório Executivo de VSM Lean
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {projectName} • {department}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Imprimir / Salvar em PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 text-slate-100">
          
          {/* Executive Summary Cards */}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 block font-mono">
              1. Indicadores Principais de Desempenho (Lean KPI Dashboard)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Lead Time Total</span>
                <span className="text-xl font-black font-mono text-white mt-1 block">
                  {formatHours(totalLeadTimeHours)}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  ~{(totalLeadTimeHours / 8).toFixed(1)} dias úteis
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Tempo de Esforço (PT)</span>
                <span className="text-xl font-black font-mono text-cyan-400 mt-1 block">
                  {formatHours(totalProcessHours)}
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  Valor agregado real
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Eficiência de Fluxo</span>
                <span className={`text-xl font-black font-mono mt-1 block ${flowEfficiency >= 15 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {flowEfficiency.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  PT ÷ LT × 100
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Rolled Yield (%C&A)</span>
                <span className="text-xl font-black font-mono text-purple-400 mt-1 block">
                  {overallYield.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(100 - overallYield).toFixed(1)}% retrabalho
                </span>
              </div>
            </div>
          </div>

          {/* Critical Bottlenecks Banner */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Gargalos Críticos Identificados</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {maxWaitStep && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">
                    Maior Tempo de Espera (Gargalo de Fila):
                  </span>
                  <strong className="text-white block mt-0.5">
                    #{maxWaitStep.order}. {maxWaitStep.title}
                  </strong>
                  <span className="text-[11px] font-mono text-slate-300">
                    Responsável: {maxWaitStep.role} • Fila de <strong>{maxWaitStep.waitTime} {maxWaitStep.waitTimeUnit}</strong>
                  </span>
                </div>
              )}
              {lowestAccuracyStep && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-500/20">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block font-mono">
                    Pior Rendimento (Gargalo de Retrabalho):
                  </span>
                  <strong className="text-white block mt-0.5">
                    #{lowestAccuracyStep.order}. {lowestAccuracyStep.title}
                  </strong>
                  <span className="text-[11px] font-mono text-slate-300">
                    %C&A de apenas <strong>{lowestAccuracyStep.percentCompleteAndAccurate}%</strong> ({100 - lowestAccuracyStep.percentCompleteAndAccurate}% de devoluções)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Step Table */}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2 block font-mono">
              2. Matriz Auditável de Etapas do Fluxo
            </span>
            <div className="overflow-x-auto custom-scrollbar border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] uppercase font-bold font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 text-center">#</th>
                    <th className="p-3">Etapa</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3 text-right">PT (Esforço)</th>
                    <th className="p-3 text-right">WT (Fila)</th>
                    <th className="p-3 text-right">%C&A</th>
                    <th className="p-3">Desperdícios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {steps.map(step => (
                    <tr key={step.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-center font-bold text-cyan-400">#{step.order}</td>
                      <td className="p-3 font-sans font-medium text-white max-w-xs">{step.title}</td>
                      <td className="p-3 font-sans text-slate-300">{step.role}</td>
                      <td className="p-3 text-right text-cyan-300">{step.processTime} {step.processTimeUnit}</td>
                      <td className="p-3 text-right text-amber-300">{step.waitTime} {step.waitTimeUnit}</td>
                      <td className="p-3 text-right font-bold text-slate-200">{step.percentCompleteAndAccurate}%</td>
                      <td className="p-3 font-sans text-[11px] text-slate-400">
                        {step.wasteTypes?.map(w => WASTE_METAS[w]?.shortLabel).join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kaizen Bursts Action List */}
          {steps.some(s => s.kaizenNotes) && (
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-2 block font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Plano de Ação Kaizen Identificado</span>
              </span>
              <div className="space-y-2">
                {steps.filter(s => s.kaizenNotes).map(s => (
                  <div key={s.id} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono">
                    <span className="text-amber-300 font-bold font-sans block">
                      Etapa #{s.order}: {s.title} ({s.role})
                    </span>
                    <p className="text-slate-200 mt-1 font-sans">
                      💡 {s.kaizenNotes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado em Markdown!' : 'Copiar Resumo em Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
