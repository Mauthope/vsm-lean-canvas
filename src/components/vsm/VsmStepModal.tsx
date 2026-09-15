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
  Plus,
  Trash2
} from 'lucide-react';
import { VSMStep, TimeUnit, WasteType } from '@/types/vsm';
import { WASTE_METAS, getRoleStyle, getStepKaizens } from '@/lib/vsmCalculations';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface VsmStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stepData: Omit<VSMStep, 'id' | 'order'> & { id?: string; order?: number }) => void;
  initialStep?: VSMStep | null;
  insertAtIndex?: number;
  existingRoles?: string[];
}

const ROLES_STORAGE_KEY = 'vsm_custom_roles_v1';

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
  insertAtIndex,
  existingRoles = []
}) => {
  const [title, setTitle] = useState('');
  const [selectedRole, setSelectedRole] = useState('Recrutador');
  const [typedRole, setTypedRole] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [processTime, setProcessTime] = useState<number>(30);
  const [processTimeUnit, setProcessTimeUnit] = useState<TimeUnit>('minutos');
  const [waitTime, setWaitTime] = useState<number>(4);
  const [waitTimeUnit, setWaitTimeUnit] = useState<TimeUnit>('horas');
  const [percentCompleteAndAccurate, setPercentCompleteAndAccurate] = useState<number>(90);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>(['espera']);
  const [kaizenList, setKaizenList] = useState<string[]>([]);
  const [newKaizenText, setNewKaizenText] = useState('');
  const [isParallel, setIsParallel] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Carregar papéis customizados salvos no LocalStorage
    let saved: string[] = [];
    try {
      const raw = localStorage.getItem(ROLES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          saved = parsed.filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar papéis customizados:', e);
    }

    // 2. Unificar com papéis já existentes nas etapas do projeto
    const fromProps = (existingRoles || []).filter(r => r && !COMMON_ROLES.includes(r));
    const merged = Array.from(new Set([...saved, ...fromProps]));
    setCustomRoles(merged);

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
      setKaizenList(getStepKaizens(initialStep));
      setNewKaizenText('');
      setIsParallel(Boolean(initialStep.isParallel));

      const stepRole = initialStep.role?.trim() || 'Recrutador';
      setSelectedRole(stepRole);
      setTypedRole('');

      if (!COMMON_ROLES.includes(stepRole) && !merged.includes(stepRole)) {
        setCustomRoles(prev => [...prev, stepRole]);
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
      setKaizenList([]);
      setNewKaizenText('');
      setIsParallel(false);
      setSelectedRole('Recrutador');
      setTypedRole('');
    }
  }, [initialStep, isOpen, existingRoles]);

  const handleAddKaizen = () => {
    const trimmed = newKaizenText.trim();
    if (!trimmed) return;
    setKaizenList(prev => [...prev, trimmed]);
    setNewKaizenText('');
  };

  const handleRemoveKaizen = (indexToRemove: number) => {
    setKaizenList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateKaizenItem = (indexToUpdate: number, value: string) => {
    setKaizenList(prev => prev.map((item, idx) => (idx === indexToUpdate ? value : item)));
  };

  if (!isOpen) return null;

  const toggleWaste = (type: WasteType) => {
    setWasteTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Quando o usuário digita no campo de novo papel
  const handleTypedRoleChange = (val: string) => {
    setTypedRole(val);
    const trimmed = val.trim();
    if (trimmed) {
      setSelectedRole(trimmed);
    }
  };

  // Fixar papel digitado permanentemente na lista de botões e LocalStorage
  const handleCommitTypedRole = (roleToCommit?: string) => {
    const target = (roleToCommit || typedRole).trim();
    if (!target) return;

    if (!COMMON_ROLES.includes(target) && !customRoles.includes(target)) {
      const updated = [...customRoles, target];
      setCustomRoles(updated);
      try {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao persistir novo papel:', e);
      }
    }
    setSelectedRole(target);
    setTypedRole('');
  };

  // Remover papel customizado da lista
  const handleRemoveCustomRole = (r: string) => {
    const updated = customRoles.filter(x => x !== r);
    setCustomRoles(updated);
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao remover papel customizado:', e);
    }
    if (selectedRole === r) {
      setSelectedRole('Recrutador');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = (typedRole.trim() && selectedRole === typedRole.trim())
      ? typedRole.trim()
      : selectedRole.trim() || 'Recrutador';

    // Salvar papel customizado permanentemente se for novo
    if (finalRole && !COMMON_ROLES.includes(finalRole) && !customRoles.includes(finalRole)) {
      const updated = [...customRoles, finalRole];
      setCustomRoles(updated);
      try {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Erro ao salvar papel no LocalStorage:', err);
      }
    }

    // Unificar itens da lista com qualquer texto que o usuário tenha digitado e não clicou em Adicionar
    const finalKaizens = [...kaizenList];
    if (newKaizenText.trim()) {
      finalKaizens.push(newKaizenText.trim());
    }
    const cleanedKaizens = finalKaizens.map(k => k.trim()).filter(Boolean);

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
      kaizenNotes: cleanedKaizens.join('\n'),
      kaizenList: cleanedKaizens,
      isParallel
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Papel / Responsável (Swimlane) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Selecionado: <strong className="text-cyan-300 font-bold">{selectedRole}</strong>
              </span>
            </div>

            {/* Role Buttons Pool (Built-in + Custom + Real-time typing) */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-2 max-h-44 overflow-y-auto custom-scrollbar">
              {/* 1. Common Built-in Roles */}
              {COMMON_ROLES.map(r => {
                const isSelected = selectedRole === r && !typedRole.trim();
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setTypedRole('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black scale-[1.02]'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}

              {/* 2. Custom Roles Added by User / Existing in Process */}
              {customRoles.map(r => {
                const isSelected = selectedRole === r && !typedRole.trim();
                return (
                  <div key={r} className="inline-flex items-center group">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole(r);
                        setTypedRole('');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md shadow-cyan-500/25 font-black scale-[1.02]'
                          : 'bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-cyan-400'}`} />
                      <span>{r}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomRole(r);
                      }}
                      className="p-1 -ml-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title={`Remover "${r}" da lista de botões`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* 3. Real-time Live Button while typing a new role */}
              {typedRole.trim() &&
                !COMMON_ROLES.includes(typedRole.trim()) &&
                !customRoles.includes(typedRole.trim()) && (
                  <button
                    type="button"
                    onClick={() => handleCommitTypedRole()}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 animate-in zoom-in-95 duration-150 cursor-pointer"
                    title="Clique para fixar este papel permanentemente como botão"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                    <span>{typedRole.trim()}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-950/25 font-mono">
                      + Novo
                    </span>
                  </button>
                )}
            </div>

            {/* Input field to type a new role */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Digite um novo papel (ex: Qualidade, Almoxarifado, Jurídico)..."
                  value={typedRole}
                  onChange={e => handleTypedRoleChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitTypedRole();
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
                />
                {typedRole && (
                  <button
                    type="button"
                    onClick={() => {
                      setTypedRole('');
                      if (selectedRole === typedRole.trim()) {
                        setSelectedRole('Recrutador');
                      }
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                    title="Limpar campo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCommitTypedRole()}
                disabled={!typedRole.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-35 disabled:hover:bg-slate-900 disabled:hover:text-cyan-300 transition-all cursor-pointer shrink-0 shadow-sm"
                title="Adicionar à lista de botões permanentes"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Botão</span>
              </button>
            </div>
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
                  <option value="dias">Dias úteis (8h48min)</option>
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
                  <option value="dias">Dias úteis (8h48min)</option>
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

            {/* Didactic explanation for %C&A */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/25 text-[11px] text-purple-200/90 leading-relaxed font-sans">
              <span className="font-bold text-purple-300 font-mono block mb-0.5">
                💡 O que significa %C&A (Percent Complete and Accurate)?
              </span>
              Mede quantas vezes em cada 100 entregas esta etapa recebe o trabalho da etapa anterior <strong>100% correto</strong>, sem dados faltando e sem necessidade de devolução ou retrabalho. Ex: se de 10 formulários recebidos, 2 vieram com dados incompletos, o %C&A é <strong>80%</strong>.
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

          {/* Kaizen Burst Notes - Múltiplas Oportunidades por Etapa */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Oportunidades de Kaizen ({kaizenList.length})</span>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {kaizenList.length === 0 ? 'Nenhum kaizen registrado' : `${kaizenList.length} raio(s) de melhoria`}
              </span>
            </div>

            {/* Existing Kaizens List */}
            {kaizenList.length > 0 && (
              <div className="space-y-2">
                {kaizenList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 flex items-start gap-2.5 group hover:border-amber-500/40 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-1">
                      #{idx + 1}
                    </span>
                    <AutoResizeTextarea
                      value={item}
                      onChange={e => handleUpdateKaizenItem(idx, e.target.value)}
                      minRows={1}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded-lg px-2 py-1 placeholder:text-slate-500 font-sans leading-relaxed transition-all"
                      placeholder="Descreva a oportunidade de melhoria..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKaizen(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 mt-0.5"
                      title="Remover este Kaizen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new Kaizen with auto-resize */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <AutoResizeTextarea
                  placeholder="Adicionar nova ideia ou oportunidade de Kaizen para esta etapa (o campo se adapta ao tamanho do texto)..."
                  value={newKaizenText}
                  onChange={e => setNewKaizenText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddKaizen();
                    }
                  }}
                  minRows={2}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500 leading-relaxed min-h-[50px]"
                />
                <button
                  type="button"
                  onClick={handleAddKaizen}
                  disabled={!newKaizenText.trim()}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer h-fit"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 pl-1 block">
                Dica: Pressione <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">Enter</kbd> para adicionar ou <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-mono">Shift + Enter</kbd> para pular linha.
              </span>
            </div>
          </div>

          {/* Parallel Step Switch */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Etapa Paralela (Concorrente)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Ocorre simultaneamente no mesmo intervalo de tempo (ex: TI e DP agindo juntos).
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

            {isParallel && (
              <div className="pt-2 border-t border-purple-500/20 text-[11px] text-purple-300/90 flex items-start gap-1.5 animate-in fade-in duration-150">
                <span className="font-bold text-purple-400">Regra Lean Office:</span>
                <span>O tempo em fila (WT) desta etapa não será somado ao Lead Time. O sistema utilizará o maior tempo do bloco simultâneo (Caminho Crítico).</span>
              </div>
            )}
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
