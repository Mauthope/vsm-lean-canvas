'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
import { VSMStep } from '@/types/vsm';
import { getRoleStyle, getStepKaizens } from '@/lib/vsmCalculations';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface VsmKaizenBoardProps {
  isOpen: boolean;
  onClose: () => void;
  steps: VSMStep[];
  onUpdateKaizen: (stepId: string, notes: string, list?: string[]) => void;
}

export const VsmKaizenBoard: React.FC<VsmKaizenBoardProps> = ({
  isOpen,
  onClose,
  steps,
  onUpdateKaizen
}) => {
  const [copied, setCopied] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ stepId: string; kaizenIndex: number } | null>(null);
  const [editText, setEditText] = useState('');
  const [newKaizenStepId, setNewKaizenStepId] = useState<string | null>(null);
  const [newKaizenInput, setNewKaizenInput] = useState('');

  if (!isOpen) return null;

  const stepsWithKaizen = steps.filter(s => getStepKaizens(s).length > 0);
  const totalKaizens = steps.reduce((acc, s) => acc + getStepKaizens(s).length, 0);

  const handleCopySummary = () => {
    if (stepsWithKaizen.length === 0) return;

    let text = `⚡ PLANO DE AÇÃO KAIZEN - MAPEAMENTO DE FLUXO DE VALOR\n`;
    text += `Total de Oportunidades Identificadas: ${totalKaizens} em ${stepsWithKaizen.length} etapas\n\n`;

    stepsWithKaizen.forEach((s, idx) => {
      const kList = getStepKaizens(s);
      text += `${idx + 1}. [Etapa #${s.order}] ${s.title} (${s.role})\n`;
      kList.forEach((k, kIdx) => {
        text += `   💡 Kaizen #${kIdx + 1}: ${k}\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const startEdit = (stepId: string, kaizenIndex: number, currentText: string) => {
    setEditingTarget({ stepId, kaizenIndex });
    setEditText(currentText);
  };

  const saveEdit = (step: VSMStep) => {
    if (!editingTarget) return;
    const current = getStepKaizens(step);
    const updated = current
      .map((k, i) => (i === editingTarget.kaizenIndex ? editText.trim() : k))
      .filter(Boolean);
    onUpdateKaizen(step.id, updated.join('\n'), updated);
    setEditingTarget(null);
  };

  const handleRemoveKaizen = (step: VSMStep, kaizenIndex: number) => {
    const current = getStepKaizens(step);
    const updated = current.filter((_, i) => i !== kaizenIndex);
    onUpdateKaizen(step.id, updated.join('\n'), updated);
    if (editingTarget?.stepId === step.id && editingTarget.kaizenIndex === kaizenIndex) {
      setEditingTarget(null);
    }
  };

  const handleAddNewKaizenToStep = (step: VSMStep) => {
    const trimmed = newKaizenInput.trim();
    if (!trimmed) return;
    const current = getStepKaizens(step);
    const updated = [...current, trimmed];
    onUpdateKaizen(step.id, updated.join('\n'), updated);
    setNewKaizenInput('');
    setNewKaizenStepId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
                {totalKaizens} {totalKaizens === 1 ? 'oportunidade' : 'oportunidades'} em {stepsWithKaizen.length} etapas
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
            disabled={totalKaizens === 0}
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Plano de Ação'}</span>
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {stepsWithKaizen.length === 0 ? (
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
            stepsWithKaizen.map((step, idx) => {
              const roleStyle = getRoleStyle(step.role);
              const kaizens = getStepKaizens(step);
              const isAddingHere = newKaizenStepId === step.id;

              return (
                <div
                  key={step.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-md flex flex-col justify-between group hover:border-amber-500/60 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
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

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                      {kaizens.length} {kaizens.length === 1 ? 'Kaizen' : 'Kaizens'}
                    </span>
                  </div>

                  {/* List of Kaizens for this Step */}
                  <div className="space-y-2">
                    {kaizens.map((kaizenText, kIdx) => {
                      const isEditingThis =
                        editingTarget?.stepId === step.id &&
                        editingTarget.kaizenIndex === kIdx;

                      return (
                        <div
                          key={kIdx}
                          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 font-mono leading-relaxed space-y-2"
                        >
                          {isEditingThis ? (
                            <div className="space-y-2">
                              <AutoResizeTextarea
                                minRows={2}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className="w-full bg-slate-950 border border-cyan-500 rounded-xl p-2.5 text-xs text-white focus:outline-none leading-relaxed"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingTarget(null)}
                                  className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEdit(step)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-1.5 flex-1">
                                <span className="text-amber-400 font-bold shrink-0">💡 #{kIdx + 1}:</span>
                                <span className="break-words">"{kaizenText}"</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => startEdit(step.id, kIdx, kaizenText)}
                                  className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Editar este Kaizen"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKaizen(step, kIdx)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Excluir este Kaizen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Another Kaizen to this Step with AutoResize */}
                  {isAddingHere ? (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <AutoResizeTextarea
                        minRows={2}
                        placeholder="Descreva outro Kaizen para esta etapa (o campo se adapta ao tamanho do texto)..."
                        value={newKaizenInput}
                        onChange={e => setNewKaizenInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNewKaizenToStep(step);
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed min-h-[48px]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">
                          <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">Enter</kbd> salvar | <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">Shift+Enter</kbd> linha
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewKaizenStepId(null);
                              setNewKaizenInput('');
                            }}
                            className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddNewKaizenToStep(step)}
                            disabled={!newKaizenInput.trim()}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 disabled:opacity-40"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNewKaizenStepId(step.id);
                        setNewKaizenInput('');
                      }}
                      className="text-left text-[11px] font-bold text-amber-400/90 hover:text-amber-300 flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Adicionar outro Kaizen nesta etapa</span>
                    </button>
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
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
