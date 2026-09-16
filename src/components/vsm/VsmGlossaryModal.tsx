'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Award
} from 'lucide-react';
import {
  FLOW_EFFICIENCY_BENCHMARKS_HR,
  FLOW_EFFICIENCY_BIBLIOGRAPHY
} from '@/lib/vsmCalculations';

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
    summary: 'A proporção do tempo total do processo em que houve trabalho real acontecendo (agregando valor) em comparação com o tempo total que o processo levou (incluindo todas as esperas e filas).',
    formula: 'Eficiência de Fluxo (%) = (Total PT ÷ Total Lead Time) × 100',
    example: 'Em um processo de R&S ou Admissão que dura 30 dias úteis (264 horas), se o tempo somado de triagem, entrevistas, checagem e cadastro for de apenas 16 horas de esforço ativo (PT), a Eficiência de Fluxo é de 16 / 264 = 6,0%. As outras 248 horas (94%) foram de pura espera do candidato, agendamento de exame e aprovação da diretoria.',
    whyItMatters: 'Na manufatura física com esteiras contínuas, a meta é de 25% a 40%. No entanto, em processos de RH e escritório, o inventário é invisível (e-mails, chamados e aprovações paradas), fazendo com que processos não otimizados operem rotineiramente abaixo de 5%. A Eficiência de Fluxo prova que a lentidão não vem de pessoas "trabalhando devagar", mas sim do tempo morto em que a solicitação fica sem ninguém tocando nela.',
    benchmark: '< 5% Crítico / Típico RH | 5% a 15% Padrão Médio | 15% a 25% Alvo Lean RH | > 25% Classe Mundial'
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
  },
  {
    id: 'future_state',
    term: 'Future State & Target State (Visão do Estado Futuro Enxuto)',
    acronym: 'Estado Futuro (Target State & Buy-in)',
    tag: 'Essência Lean Six Sigma',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    summary: 'A projeção quantificável e auditável de como o fluxo de valor funcionará após a implementação das melhorias. Segundo Mike Rother e John Shook (Lean Enterprise Institute - "Learning to See"), mapear o Estado Atual sem projetar o Estado Futuro é apenas registrar desperdícios sem direção.',
    formula: 'Lead Time Futuro = Soma do WT Projetado (Filas Reduzidas) + PT Otimizado',
    example: 'Durante a dinâmica, a equipe analisa uma etapa com 48 horas de fila (WT) e associa a ela o Kaizen de aprovação automatizada por alçadas. Em consenso, os participantes estipulam que o WT futuro será de 6 horas (-87,5%). O sistema atualiza em tempo real o novo Lead Time do projeto e a nova Eficiência de Fluxo.',
    whyItMatters: 'Princípio do Gemba e Compromisso (Toyota Way): quem deve estipular o estado futuro são as pessoas que executam o processo, gerando "Accountability" e pertencimento. No Lean Office / Serviços, mais de 90% do Lead Time é pura fila (WT). Focar na redução do WT estipulado pela equipe conecta diretamente a fase Improve à fase Control do DMAIC (Six Sigma), comprovando o ROI do projeto.',
    benchmark: 'Redução típica de 50% a 80% de tempo de fila (WT) e salto de 3x a 5x na Eficiência de Fluxo.'
  },
  {
    id: 'kaizen_5w2h',
    term: 'Plano Kaizen 5W2H & Cronograma com Responsáveis',
    acronym: '5W2H Kaizen (Do Diagnóstico à Execução)',
    tag: 'Execução Lean & Governança',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    summary: 'A ponte metodológica essencial que transforma o Target State do VSM em um plano de ação tático executável. Cada redução de Lead Time (WT Futuro) ganha um Kaizen estruturado com escopo claro (O quê), justificativa ligada ao gargalo (Por quê), setor/etapa (Onde), nome da pessoa física responsável direta (Quem - e não o cargo genérico) e datas inicial e final precisas (Quando).',
    formula: 'Compromisso 5W2H = O Quê (Escopo) + Por Quê (Meta WT) + Onde (Etapa) + Quem (Nome do Responsável) + Quando (Data Inicial ➔ Data Final)',
    example: 'Ao pactuar uma redução de 72h para 12h no alinhamento de perfil, a equipe formaliza: What = "Criar formulário inteligente padronizado de briefing de vaga", Why = "Eliminar 60h de vaivém de mensagens na etapa de alinhamento", Where = "Etapa 2 - Alinhamento com Gestor", Who = "Mariana Prestes (pessoa física designada)", Quando = "De 20/09/2026 a 20/10/2026 (30 dias)". O "Como" e "Quanto Custa" ficam flexíveis para detalhamento posterior.',
    whyItMatters: 'Evita a principal falha dos workshops corporativos: sair da sala com um diagnóstico impecável, mas com donos anônimos ("o RH vai ver", "a TI precisa fazer") e prazos abstratos. Ao exigir o nome da pessoa física responsável e datas precisas de início e término em uma tabela consolidada, cria-se responsabilidade real (Accountability) e clareza no Gemba.',
    benchmark: 'Pactuar líderes com nome e sobrenome e datas claras de início e entrega para 100% das ações.'
  },
  {
    id: 'maturity_score',
    term: 'Nota de Maturidade Lean do Processo (Score 0 a 100)',
    acronym: 'Maturidade Lean (Score 0-100 & 3 Pilares)',
    tag: 'Diagnóstico & Governança',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    summary: 'Indicador executivo composto (de 0 a 100 pontos, calibrado entre 15 e 98) que quantifica a saúde e maturidade Lean de um fluxo de trabalho corporativo ou de RH. Avalia simultaneamente a Eficiência de Fluxo (tempo), a Qualidade Rolada (%C&A / primeira passagem sem retrabalho) e o engajamento contínuo em melhorias (iniciativas Kaizen pactuadas).',
    formula: 'Nota de Maturidade = Score Eficiência (até 40 pts) + Score Qualidade (até 40 pts) + Score Kaizen (até 20 pts)',
    example: 'Um fluxo de RH/Escritório com 6,2% de Eficiência de Fluxo obtém (6,2 / 15) × 40 = 16,5 pts de tempo; com 72% de Qualidade Rolada (%C&A acumulado) obtém (72 / 85) × 40 = 33,9 pts de qualidade; e com 3 ações Kaizen pactuadas para 6 etapas obtém 20 pts de cultura Kaizen. Nota Final = 16,5 + 33,9 + 20 = 70 pontos ("Maturidade Intermediária").',
    whyItMatters: 'Oferece à alta liderança e aos facilitadores um indicador objetivo, matemático e auditável para comparar a evolução do fluxo antes e depois do workshop Lean, eliminando debates subjetivos sobre se o processo está rápido ou burocrático.',
    benchmark: '≥ 75 pts: Classe Mundial | 50 a 74 pts: Intermediária | 35 a 49 pts: Típico Corporativo | < 35 pts: Inicial'
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

  useEffect(() => {
    if (initialTopic) {
      setSelectedConceptId(initialTopic);
    }
  }, [initialTopic, isOpen]);

  if (!isOpen) return null;

  const filteredConcepts = LEAN_CONCEPTS.filter(c =>
    c.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConcept = LEAN_CONCEPTS.find(c => c.id === selectedConceptId) || LEAN_CONCEPTS[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
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

              {/* Specialized Benchmark Grid for Flow Efficiency */}
              {currentConcept.id === 'fe' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    <span>📊 Faixas de Referência Lean Six Sigma para RH & Escritório:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {FLOW_EFFICIENCY_BENCHMARKS_HR.map(b => (
                      <div
                        key={b.tier}
                        className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-cyan-300 text-xs">
                            {b.range}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {b.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {b.description}
                        </p>
                        <div className="text-[10px] text-slate-400 italic">
                          <strong>Cenário típico:</strong> {b.typicalScenario}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 pt-1 border-t border-slate-800/80">
                          <strong>Meta Lean:</strong> {b.target}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bibliographic Foundation */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Autores e Obras que Definiram Estes Padrões:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {FLOW_EFFICIENCY_BIBLIOGRAPHY.map(ref => (
                        <div
                          key={ref.id}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-cyan-300">{ref.author} ({ref.year})</span>
                            <span className="text-slate-500 font-medium">
                              {ref.publisherOrAward.includes('Shingo') ? '🏆 Shingo Prize' : 'Lean Service'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200">
                            {ref.work}
                          </div>
                          <div className="text-[10px] text-slate-400 italic">
                            {ref.publisherOrAward}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug pt-0.5">
                            {ref.benchmarkStatement}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Specialized Interactive Memorial for Lean Maturity Score */}
              {currentConcept.id === 'maturity_score' && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Memorial dos 3 Pilares da Nota (Composição dos 100 Pontos):</span>
                  </div>

                  {/* 3 Pillars Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Pilar 1 */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          Pilar 1 • Até 40 pts
                        </span>
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <h5 className="text-xs font-bold text-white">
                        Eficiência de Fluxo (FE)
                      </h5>
                      <div className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        min(40, (FE ÷ 15%) × 40)
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Mede quanto tempo o item avança em esforço real (PT) vs. o tempo morto em filas (WT). Atinge a nota máxima (40 pts) com <strong className="text-cyan-300">15% ou mais</strong> de eficiência.
                      </p>
                    </div>

                    {/* Pilar 2 */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          Pilar 2 • Até 40 pts
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <h5 className="text-xs font-bold text-white">
                        Qualidade Rolada (%C&A)
                      </h5>
                      <div className="text-[10px] font-mono font-bold text-purple-300 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        min(40, (RFPY ÷ 85%) × 40)
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Multiplicação da acurácia de todas as etapas. Avalia entregas de primeira sem vaivém de dúvidas ou correção de dados. Atinge 40 pts a partir de <strong className="text-purple-300">85%</strong> de rendimento acumulado.
                      </p>
                    </div>

                    {/* Pilar 3 */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Pilar 3 • Até 20 pts
                        </span>
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <h5 className="text-xs font-bold text-white">
                        Engajamento Kaizen
                      </h5>
                      <div className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        min(20, (Kaizens ÷ (Etapas × 0.40)) × 20)
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Mede a maturidade do time em propor melhorias concretas. Atinge 20 pts quando ao menos <strong className="text-amber-300">40% das etapas</strong> possuem planos de melhoria estruturados.
                      </p>
                    </div>
                  </div>

                  {/* Classification Tiers */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
                      Classificação Executiva das Faixas de Maturidade:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-emerald-400">75 a 100 • Classe Mundial / Lean Otimizado</strong>
                          <span className="text-[10px] text-emerald-300 font-bold">Nível A</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          Fluxo contínuo ágil e digital, paralelismo efetivo, tempo de fila residual e retrabalho quase nulo.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-cyan-400">50 a 74 • Maturidade Intermediária</strong>
                          <span className="text-[10px] text-cyan-300 font-bold">Nível B</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          Processo estruturado com bons SLAs, mas ainda com passagens de bastão manuais e esperas parciais.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-amber-400">35 a 49 • Típico Corporativo</strong>
                          <span className="text-[10px] text-amber-300 font-bold">Nível C</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          Padrão mais comum no mercado: 90%+ do Lead Time parado em caixas de entrada de e-mail e aprovações hierárquicas.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-rose-400">15 a 34 • Processo Inicial & Fragmentado</strong>
                          <span className="text-[10px] text-rose-300 font-bold">Nível D</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          Gargalos severos de espera, alto retrabalho e ausência de padronização, exigindo intervenção Kaizen imediata.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Motor Heurístico vs AI */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <strong className="text-slate-200 block font-mono text-xs">
                      ⚙️ Motor Especialista Lean vs. Diagnóstico com Inteligência Artificial:
                    </strong>
                    <p className="leading-relaxed">
                      O <strong>Motor Local</strong> calcula a pontuação de forma 100% matemática, auditável e instantânea a cada alteração no canvas. Quando acionado o módulo de <strong>IA (OpenAI/Gemini)</strong>, a IA analisa os nomes dos cargos, as causas-raiz e os gargalos para fornecer o parecer consultivo qualitativo e o roadmap de 30-60-90 dias.
                    </p>
                  </div>
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
