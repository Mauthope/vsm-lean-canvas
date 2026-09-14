'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Save,
  Building2,
  Workflow,
  FolderOpen
} from 'lucide-react';

interface VsmNewWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, department: string) => void;
  mode?: 'create' | 'save_as';
  initialName?: string;
  initialDepartment?: string;
}

const COMMON_DEPTS = [
  'Operações',
  'Recursos Humanos',
  'Supply Chain & Logística',
  'Compras & Suprimentos',
  'Financeiro & Controladoria',
  'Tecnologia (TI)',
  'Comercial & Vendas',
  'Atendimento & CS'
];

export const VsmNewWorkshopModal: React.FC<VsmNewWorkshopModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialName = '',
  initialDepartment = ''
}) => {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Operações');
  const [customDept, setCustomDept] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'save_as' && initialName) {
        setName(initialName.endsWith('(Cópia)') ? initialName : `${initialName} (Modelo)`);
      } else {
        setName(initialName || '');
      }

      if (initialDepartment) {
        if (COMMON_DEPTS.includes(initialDepartment)) {
          setDepartment(initialDepartment);
          setIsCustomDept(false);
        } else {
          setIsCustomDept(true);
          setCustomDept(initialDepartment);
        }
      } else {
        setDepartment('Operações');
        setIsCustomDept(false);
      }
    }
  }, [isOpen, mode, initialName, initialDepartment]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (mode === 'create' ? 'Novo Workshop VSM' : 'Mapeamento VSM');
    const finalDept = isCustomDept ? (customDept.trim() || 'Geral') : department;
    onSubmit(finalName, finalDept);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-cyan-500/20">
              {mode === 'create' ? <Plus className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                {mode === 'create' ? 'Novo Workshop em Branco' : 'Salvar como Modelo Customizado'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {mode === 'create'
                  ? 'Começar do zero com canvas limpo (salvo no LocalStorage)'
                  : 'Ficará disponível no menu de Modelos Prontos'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          
          {/* Workshop Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block font-mono">
              Nome do Workshop / Processo:
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={mode === 'create' ? 'Ex: Mapeamento de Faturamento & Notas Fiscais' : 'Ex: Modelo Padrão de Compras'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-500"
              required
            />
          </div>

          {/* Department Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 block font-mono">
                Área / Departamento:
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDept(!isCustomDept)}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                {isCustomDept ? 'Escolher da Lista' : '+ Outro Departamento'}
              </button>
            </div>

            {isCustomDept ? (
              <input
                type="text"
                value={customDept}
                onChange={e => setCustomDept(e.target.value)}
                placeholder="Digite o nome da área..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-500 font-mono"
              />
            ) : (
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              >
                {COMMON_DEPTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold font-mono">
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Armazenamento Local Automático (LocalStorage):</span>
            </div>
            <p className="leading-relaxed">
              {mode === 'create'
                ? 'Ao criar, este workshop será adicionado aos seus Modelos Prontos salvos. Todas as etapas adicionadas ficarão salvas automaticamente no seu navegador.'
                : 'O fluxo e as etapas atuais serão salvos como um novo modelo reutilizável, que você poderá carregar a qualquer momento no menu superior.'}
            </p>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {mode === 'create' ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{mode === 'create' ? 'Iniciar Workshop do Zero' : 'Salvar como Modelo'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
