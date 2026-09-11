'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Pencil,
  FileSpreadsheet
} from 'lucide-react';
import { VSMStep } from '@/types/vsm';
import { getRoleStyle } from '@/lib/vsmCalculations';

interface VsmKaizenBoardProps {
  isOpen: boolean;
  onClose: () => void;
  steps: VSMStep[];
  onUpdateKaizen: (stepId: string, notes: string) => void;
}

export const VsmKaizenBoard: React.FC<VsmKaizenBoardProps> = ({
  isOpen,
  onClose,
  steps,
  onUpdateKaizen
}) => {
  const [copied, setCopied] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen) return null;

  const kaizenSteps = steps.filter(s => s.kaizenNotes && s.kaizenNotes.trim().length > 0);

  const handleCopySummary = () => {
    if (kaizenSteps.length === 0) return;

    let text = `⚡ PLANO DE AÇÃO KAIZEN - MAPEAMENTO DE FLUXO DE VALOR\n`;
    text += `Total de Oportunidades Identificadas: ${kaizenSteps.length}\n\n`;

    kaizenSteps.forEach((s, idx) => {
      text += `${idx + 1}. [Etapa #${s.order}] ${s.title} (${s.role})\n`;
      text += `   💡 Kaizen: ${s.kaizenNotes}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const startEdit = (step: VSMStep) => {
    setEditingStepId(step.id);
    setEditNotes(step.kaizenNotes || '');
  };

  const saveEdit = (stepId: string) => {
    onUpdateKaizen(stepId, editNotes);
    setEditingStepId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Raios de Kaizen (Oportunidades)
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {kaizenSteps.length} ações levantadas na sessão
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Ideias de melhoria colhidas com a equipe
          </span>
          <button
            type="button"
            disabled={kaizenSteps.length === 0}
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Plano de Ação'}</span>
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {kaizenSteps.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                Nenhum Raio de Kaizen registrado
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Abra qualquer etapa no canvas e adicione oportunidades de melhoria ou automação identificadas durante a conversa com o time.
              </p>
            </div>
          ) : (
            kaizenSteps.map((step, idx) => {
              const roleStyle = getRoleStyle(step.role);
              const isEditing = editingStepId === step.id;

              return (
                <div
                  key={step.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-md flex flex-col justify-between group hover:border-amber-500/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-mono text-slate-500">•</span>
                        <span className="text-xs font-bold text-white font-heading">
                          Etapa #{step.order}: {step.title}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                        <span>{step.role}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => (isEditing ? saveEdit(step.id) : startEdit(step))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title={isEditing ? 'Salvar' : 'Editar Nota'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={3}
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-cyan-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingStepId(null)}
                          className="px-2.5 py-1 rounded text-xs text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(step.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 font-mono leading-relaxed">
                      "{step.kaizenNotes}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Pronto para alimentar o Plano de Ação 5W2H
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
