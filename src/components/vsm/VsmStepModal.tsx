'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  GitBranch,
  User,
  Plus
} from 'lucide-react';
import { VSMStep, TimeUnit, WasteType } from '@/types/vsm';
import { WASTE_METAS, getRoleStyle } from '@/lib/vsmCalculations';

interface VsmStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stepData: Omit<VSMStep, 'id' | 'order'> & { id?: string; order?: number }) => void;
  initialStep?: VSMStep | null;
  insertAtIndex?: number;
}

const COMMON_ROLES = [
  'Recrutador',
  'Gestor',
  'Gestor Requisitante',
  'DP',
  'TI',
  'Candidato',
  'Colaborador',
  'Financeiro',
  'Diretoria',
  'Compras',
  'RH'
];

export const VsmStepModal: React.FC<VsmStepModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStep,
  insertAtIndex
}) => {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('Recrutador');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [description, setDescription] = useState('');
  const [processTime, setProcessTime] = useState<number>(30);
  const [processTimeUnit, setProcessTimeUnit] = useState<TimeUnit>('minutos');
  const [waitTime, setWaitTime] = useState<number>(4);
  const [waitTimeUnit, setWaitTimeUnit] = useState<TimeUnit>('horas');
  const [percentCompleteAndAccurate, setPercentCompleteAndAccurate] = useState<number>(90);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>(['espera']);
  const [kaizenNotes, setKaizenNotes] = useState('');
  const [isParallel, setIsParallel] = useState(false);

  useEffect(() => {
    if (initialStep) {
      setTitle(initialStep.title || '');
      setDescription(initialStep.description || '');
      setProcessTime(initialStep.processTime || 0);
      setProcessTimeUnit(initialStep.processTimeUnit || 'minutos');
      setWaitTime(initialStep.waitTime || 0);
      setWaitTimeUnit(initialStep.waitTimeUnit || 'horas');
      setPercentCompleteAndAccurate(
        typeof initialStep.percentCompleteAndAccurate === 'number'
          ? initialStep.percentCompleteAndAccurate
          : 90
      );
      setWasteTypes(initialStep.wasteTypes || []);
      setKaizenNotes(initialStep.kaizenNotes || '');
      setIsParallel(Boolean(initialStep.isParallel));

      if (COMMON_ROLES.includes(initialStep.role)) {
        setRole(initialStep.role);
        setIsCustomRole(false);
      } else {
        setIsCustomRole(true);
        setCustomRole(initialStep.role);
      }
    } else {
      // Reset defaults for new step
      setTitle('');
      setDescription('');
      setProcessTime(30);
      setProcessTimeUnit('minutos');
      setWaitTime(4);
      setWaitTimeUnit('horas');
      setPercentCompleteAndAccurate(90);
      setWasteTypes([]);
      setKaizenNotes('');
      setIsParallel(false);
      setRole('Recrutador');
      setIsCustomRole(false);
      setCustomRole('');
    }
  }, [initialStep, isOpen]);

  if (!isOpen) return null;

  const toggleWaste = (type: WasteType) => {
    setWasteTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isCustomRole ? (customRole.trim() || 'Outro') : role;

    onSave({
      id: initialStep?.id,
      order: initialStep?.order,
      title: title.trim() || 'Nova Etapa',
      role: finalRole,
      description: description.trim(),
      processTime: Math.max(0, Number(processTime) || 0),
      processTimeUnit,
      waitTime: Math.max(0, Number(waitTime) || 0),
      waitTimeUnit,
      percentCompleteAndAccurate: Math.min(100, Math.max(0, Number(percentCompleteAndAccurate) || 0)),
      wasteTypes,
      kaizenNotes: kaizenNotes.trim(),
      isParallel
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                {initialStep ? 'Editar Etapa do VSM' : 'Nova Etapa no Fluxo'}
              </h2>
              <span className="text-xs text-slate-400">
                {initialStep ? `Etapa #${initialStep.order}` : insertAtIndex !== undefined ? `Inserir na posição #${insertAtIndex + 1}` : 'Adicionar ao final da esteira'}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Título da Etapa <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Entrevista Técnica com Gestor"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Role / Responsável */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Papel / Responsável (Swimlane)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ROLES.map(r => {
                const isSelected = !isCustomRole && role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setIsCustomRole(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomRole(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCustomRole
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                + Outro
              </button>
            </div>

            {isCustomRole && (
              <input
                type="text"
                placeholder="Digite o nome do papel ou departamento..."
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all mt-1"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 font-mono">
              Descrição das Atividades
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o que acontece nesta etapa, ferramentas usadas, canais..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Times Grid: PT & WT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
            
            {/* Process Time (PT) */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>Process Time (PT) - Esforço Real</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={processTime}
                  onChange={e => setProcessTime(parseFloat(e.target.value) || 0)}
                  className="w-24 sm:w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <select
                  value={processTimeUnit}
                  onChange={e => setProcessTimeUnit(e.target.value as TimeUnit)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="dias">Dias úteis (8h)</option>
                </select>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                Tempo real trabalhando na tarefa.
              </span>
            </div>

            {/* Wait Time (WT) */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Wait Time (WT) - Fila / Espera</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={waitTime}
                  onChange={e => setWaitTime(parseFloat(e.target.value) || 0)}
                  className="w-24 sm:w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <select
                  value={waitTimeUnit}
                  onChange={e => setWaitTimeUnit(e.target.value as TimeUnit)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="dias">Dias</option>
                </select>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">
                Tempo parado aguardando a vez.
              </span>
            </div>

          </div>

          {/* %C&A Slider */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>% Completo & Correto (%C&A)</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${
                percentCompleteAndAccurate >= 90
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : percentCompleteAndAccurate >= 75
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                {percentCompleteAndAccurate}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={percentCompleteAndAccurate}
              onChange={e => setPercentCompleteAndAccurate(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Alto Retrabalho)</span>
              <span>80% (Média Corporativa)</span>
              <span>100% (Perfeito)</span>
            </div>
          </div>

          {/* Desperdícios Lean (Muda) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 font-mono">
              Desperdícios Identificados (Muda)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(WASTE_METAS) as WasteType[]).map(key => {
                const meta = WASTE_METAS[key];
                const active = wasteTypes.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleWaste(key)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {}}
                      className="mt-0.5 accent-cyan-500"
                    />
                    <div>
                      <span className={`text-xs font-bold block ${active ? meta.colorClass : 'text-slate-300'}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                        {meta.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kaizen Burst Notes */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Oportunidade de Kaizen (Raio de Melhoria)</span>
            </div>
            <textarea
              rows={2}
              placeholder="Anote ideias levantadas pelo time para eliminar o desperdício desta etapa..."
              value={kaizenNotes}
              onChange={e => setKaizenNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Parallel Step Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Etapa Paralela (Concorrente)
                </span>
                <span className="text-[10px] text-slate-400">
                  Ocorre simultaneamente com a etapa anterior (ex: TI e DP agindo juntos).
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isParallel}
                onChange={e => setIsParallel(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {initialStep ? 'Salvar Alterações' : 'Adicionar Etapa'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
