'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
  Percent,
  Layers,
  Flame,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Search,
  ArrowRight
} from 'lucide-react';

interface VsmGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

interface Concept {
  id: string;
  term: string;
  acronym: string;
  tag: string;
  color: string;
  bg: string;
  border: string;
  summary: string;
  formula?: string;
  example: string;
  whyItMatters: string;
  benchmark?: string;
}

export const LEAN_CONCEPTS: Concept[] = [
  {
    id: 'ca',
    term: 'Percent Complete and Accurate',
    acronym: '%C&A (% Completo & Correto)',
    tag: 'Qualidade & Retrabalho',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    summary: 'A porcentagem de vezes que uma etapa recebe o trabalho da etapa anterior 100% correto, completo e sem a necessidade de devolução, correção ou pedido de esclarecimento.',
    formula: '%C&A = (Entregas Sem Erro ÷ Total de Entregas) × 100',
    example: 'No processo de admissão, o candidato envia fotos dos documentos. Se a foto do RG estiver cortada ou ilegível e o DP precisar ligar ou mandar e-mail pedindo reenvio, essa entrega foi imperfeita (0% C&A). Se em 100 admissões, 25 tiverem documentos faltantes, o %C&A dessa etapa é de apenas 75%.',
    whyItMatters: 'Em escritórios e no RH, o retrabalho costuma ser invisível: são e-mails de cobrança, idas e vindas de aprovação e conferências repetidas. Pequenos erros no início se multiplicam dramaticamente ao longo do fluxo.',
    benchmark: 'Etapas saudáveis buscam > 90% a 95% C&A.'
  },
  {
    id: 'pt',
    term: 'Process Time',
    acronym: 'PT (Tempo de Esforço / Toque)',
    tag: 'Valor Agregado',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    summary: 'O tempo real em que uma pessoa ou sistema está ativamente executando, analisando, digitando ou agregando valor à tarefa.',
    example: 'O recrutador leva 45 minutos para entrevistar um candidato, ou o DP leva 20 minutos para cadastrar o funcionário na folha de pagamento. O PT dessa etapa é de 45 min e 20 min, respectivamente.',
    whyItMatters: 'O PT representa o custo direto de mão-de-obra e capacidade do time. Surpreendentemente, no fluxo administrativo, o PT costuma representar menos de 5% do tempo total!',
    benchmark: 'Tempo de esforço ativo focado sem interrupções.'
  },
  {
    id: 'wt',
    term: 'Wait Time',
    acronym: 'WT (Tempo de Espera / Fila)',
    tag: 'Desperdício Puro (Muda)',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    summary: 'O tempo em que a requisição fica completamente parada, aguardando na caixa de entrada, esperando a resposta de um gestor, aguardando disponibilidade de agenda ou na fila do sistema.',
    example: 'A requisição de vaga foi aberta na segunda-feira, mas o gestor só respondeu o alinhamento na quinta-feira. O tempo parado foi de 3 dias (72 horas) de pura espera (WT).',
    whyItMatters: 'O tempo de espera é o maior vilão da lentidão corporativa. Ele não agrega nenhum valor ao colaborador ou à empresa e gera ansiedade e perda de candidatos/talentos.',
    benchmark: 'O objetivo Lean número 1 é eliminar ou reduzir filas e esperas.'
  },
  {
    id: 'lt',
    term: 'Lead Time',
    acronym: 'LT (Tempo de Ponta a Ponta)',
    tag: 'Velocidade de Entrega',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    summary: 'O tempo total decorrido desde o instante em que a solicitação é feita até o momento em que o resultado final é entregue ao destinatário.',
    formula: 'Lead Time = Soma de todos os Tempos de Espera (WT) + Soma de todos os Tempos de Esforço (PT)',
    example: 'Desde o dia em que uma vaga foi aprovada até o primeiro dia de trabalho do novo funcionário decorreram 35 dias úteis. Esse é o Lead Time do processo de R&S.',
    whyItMatters: 'É o indicador que o cliente final (gestor ou candidato) percebe. Reduzir o Lead Time significa dar respostas rápidas ao negócio.',
    benchmark: 'Processos enxutos reduzem o Lead Time em até 70% cortando filas.'
  },
  {
    id: 'fe',
    term: 'Flow Efficiency',
    acronym: 'FE (Eficiência de Fluxo)',
    tag: 'Saúde do Processo',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    summary: 'A proporção do tempo total do processo em que houve trabalho real acontecendo em comparação com o tempo em que o processo ficou parado esperando.',
    formula: 'Eficiência de Fluxo (%) = (Total PT ÷ Total Lead Time) × 100',
    example: 'Se um processo de compras leva 20 dias úteis (160 horas no total), mas somando o tempo que o comprador e o gestor realmente trabalharam nas tarefas temos apenas 8 horas, a Eficiência de Fluxo é de 8 / 160 = 5%. As outras 152 horas foram desperdício em filas.',
    whyItMatters: 'Mostra imediatamente se a equipe está lenta por falta de braço (alto PT) ou por barreiras de fluxo, burocracia e filas (alto WT).',
    benchmark: '< 5% Crítico / Típico corporativo | 5% a 15% Moderado | > 15% Classe Mundial.'
  },
  {
    id: 'rfpy',
    term: 'Rolled First Pass Yield',
    acronym: 'RFPY (Rendimento Total Cumulativo)',
    tag: 'Efeito Cascata',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    summary: 'A probabilidade matemática de uma solicitação passar por todas as etapas do processo do início ao fim sem sofrer nenhum defeito ou retrabalho em nenhuma delas.',
    formula: 'RFPY = (%C&A₁ / 100) × (%C&A₂ / 100) × ... × (%C&Aₙ / 100) × 100',
    example: 'Se um processo tem 6 etapas e cada etapa tem 90% de acerto (%C&A), o rendimento final não é 90%! É 0.90⁶ = 53,1%. Isso significa que 46,9% de todos os processos sofreram algum tipo de retrabalho ou atraso antes de serem finalizados.',
    whyItMatters: 'Demonstra aos executivos o custo oculto de pequenas falhas e documentos incompletos que parecem inofensivos em cada setor individual.',
    benchmark: 'Fluxos de alta maturidade alcançam > 80% a 90% de RFPY.'
  },
  {
    id: 'bottleneck',
    term: 'Gargalo Crítico / Restrição',
    acronym: 'Gargalo (Teoria das Restrições)',
    tag: 'Foco Estratégico',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    summary: 'O ponto do fluxo que limita a velocidade de todo o processo. Pode ser um gargalo de tempo (maior tempo de espera/fila) ou um gargalo de qualidade (pior %C&A).',
    example: 'Se os gestores demoram 4 dias para dar o feedback da entrevista e todas as outras etapas demoram poucas horas, esse feedback é o gargalo. Melhorar qualquer outra etapa não tornará o processo mais rápido enquanto o feedback demorar 4 dias.',
    whyItMatters: 'Qualquer melhoria feita fora do gargalo é uma ilusão de ótica. O foco do consultor Lean e da equipe deve ser 100% no gargalo.',
    benchmark: 'Identificar a restrição e aplicar Kaizen imediato.'
  },
  {
    id: 'kaizen',
    term: 'Kaizen Burst (Raio de Melhoria)',
    acronym: 'Kaizen (Melhoria Contínua)',
    tag: 'Ação Prática',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    summary: 'Ideias de melhoria pontuais, rápidas e práticas levantadas pela equipe durante a dinâmica para eliminar um desperdício específico detectado em uma etapa.',
    example: 'Adotar uma ferramenta tipo Calendly para eliminar troca de 5 e-mails para marcar uma entrevista, ou criar um checklist de fotos no app para evitar que o candidato mande documento cortado.',
    whyItMatters: 'Gera o plano de ação concreto do workshop. O VSM sem Kaizen é apenas um desenho; com Kaizen, vira transformação real.',
    benchmark: 'Priorizar Quick Wins (alto impacto e baixo esforço).'
  }
];

export const VsmGlossaryModal: React.FC<VsmGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialTopic
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConceptId, setSelectedConceptId] = useState<string>(
    initialTopic || LEAN_CONCEPTS[0].id
  );

  if (!isOpen) return null;

  const filteredConcepts = LEAN_CONCEPTS.filter(c =>
    c.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConcept = LEAN_CONCEPTS.find(c => c.id === selectedConceptId) || LEAN_CONCEPTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-heading">
                  Guia Didático & Glossário Lean VSM
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                  Aprenda Enquanto Usa
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Entenda o significado e o impacto prático de cada métrica em processos de RH e administrativos.
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

        {/* Modal Search and Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Concept List */}
          <div className="md:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/60 overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar conceito ou sigla..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-2 overflow-y-auto custom-scrollbar flex-1 space-y-1">
              {filteredConcepts.map(c => {
                const isSelected = c.id === currentConcept.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConceptId(c.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer block border ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                        : 'border-transparent hover:bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {c.acronym}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${c.bg} ${c.color} ${c.border}`}>
                        {c.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {c.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Explanation */}
          <div className="md:col-span-7 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between space-y-6 bg-[#060a13]">
            <div className="space-y-4">
              
              {/* Header of Concept */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${currentConcept.bg} ${currentConcept.color} ${currentConcept.border}`}>
                    {currentConcept.tag}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentConcept.term}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white font-heading tracking-tight">
                  {currentConcept.acronym}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  {currentConcept.summary}
                </p>
              </div>

              {/* Mathematical Formula (if applicable) */}
              {currentConcept.formula && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono mb-1">
                    📐 Como é Calculado:
                  </span>
                  <div className="font-mono text-xs font-bold text-cyan-300">
                    {currentConcept.formula}
                  </div>
                </div>
              )}

              {/* Practical Real-World Example */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-cyan-400" />
                  <span>Exemplo Prático Corporativo (RH / Administrativo):</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentConcept.example}
                </p>
              </div>

              {/* Why it Matters in Lean */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Por que isso é crítico no mapeamento?</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentConcept.whyItMatters}
                </p>
              </div>

              {/* Benchmark Recommendation */}
              {currentConcept.benchmark && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span><strong>Meta / Benchmark:</strong> {currentConcept.benchmark}</span>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Navegue pelos conceitos à esquerda para dominar o VSM.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                Entendido, voltar ao Canvas
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
