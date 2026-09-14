import { VSMStep, BottleneckAnalysis, WasteType } from '@/types/vsm';
import {
  convertTimeToHours,
  formatHours,
  WASTE_METAS,
  HOURS_PER_WORK_DAY,
  getStepKaizens
} from '@/lib/vsmCalculations';

export interface AiDiagnosticReport {
  timestamp: string;
  projectName: string;
  department: string;
  provider?: string;
  isLiveAi?: boolean;
  note?: string;
  maturityScore: number;
  maturityLabel: string;
  maturityColor: string;
  executiveSummary: string;
  keyInsights: string[];
  bottleneckAnalysis: {
    waitBottleneck: {
      stepTitle: string;
      role: string;
      waitTimeHours: number;
      percentageOfLeadTime: number;
      rootCauses: string[];
      impact: string;
    } | null;
    qualityBottleneck: {
      stepTitle: string;
      role: string;
      accuracy: number;
      reworkRisk: string;
      rootCauses: string[];
      impact: string;
    } | null;
    effortBottleneck: {
      stepTitle: string;
      role: string;
      processTimeHours: number;
      workloadRisk: string;
    } | null;
  };
  mudaBreakdown: {
    type: WasteType;
    label: string;
    count: number;
    description: string;
    action: string;
  }[];
  futureStateSimulation: {
    currentLeadTimeHours: number;
    projectedLeadTimeHours: number;
    leadTimeReductionPercent: number;
    currentFlowEfficiency: number;
    projectedFlowEfficiency: number;
    currentYield: number;
    projectedYield: number;
    summary: string;
  };
  actionRoadmap: {
    quickWins: { action: string; impact: string; effort: 'Baixo' | 'Médio'; targetStep: string }[];
    structuralImprovements: { action: string; impact: string; effort: 'Médio' | 'Alto'; targetStep: string }[];
    automationProjects: { action: string; impact: string; effort: 'Médio' | 'Alto'; targetStep: string }[];
  };
}

export function generateVsmAiDiagnostic(
  projectName: string,
  department: string,
  steps: VSMStep[],
  metrics: BottleneckAnalysis,
  focusArea: 'all' | 'speed' | 'quality' | 'automation' = 'all'
): AiDiagnosticReport {
  const {
    totalLeadTimeHours,
    totalProcessHours,
    totalWaitHours,
    flowEfficiency,
    overallYield,
    maxWaitStep,
    lowestAccuracyStep
  } = metrics;

  // 1. Calculate Lean Maturity Score (0 - 100)
  // Flow Efficiency contributes up to 40 pts (>15% is optimal, <5% is poor)
  const efficiencyScore = Math.min(40, (flowEfficiency / 15) * 40);
  // Overall Yield (%C&A rolled) contributes up to 40 pts (>85% is optimal)
  const yieldScore = Math.min(40, (overallYield / 85) * 40);
  // Kaizen engagement & waste mapping contributes up to 20 pts
  const allKaizens = steps.flatMap(s =>
    getStepKaizens(s).map(k => ({ step: s, kaizen: k }))
  );
  const kaizenScore = Math.min(20, (allKaizens.length / Math.max(1, steps.length * 0.4)) * 20);

  const rawScore = Math.round(efficiencyScore + yieldScore + kaizenScore);
  const maturityScore = Math.max(15, Math.min(98, rawScore));

  let maturityLabel = 'Processo Inicial & Fragmentado';
  let maturityColor = 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  if (maturityScore >= 75) {
    maturityLabel = 'Classe Mundial / Lean Otimizado';
    maturityColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  } else if (maturityScore >= 50) {
    maturityLabel = 'Maturidade Intermediária';
    maturityColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
  } else if (maturityScore >= 35) {
    maturityLabel = 'Típico Corporativo (Alta Fila & Retrabalho)';
    maturityColor = 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  }

  // 2. Executive Summary
  const leadTimeDays = (totalLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1);
  const processTimeDays = (totalProcessHours / HOURS_PER_WORK_DAY).toFixed(1);
  const waitPercentage = totalLeadTimeHours > 0 ? ((totalWaitHours / totalLeadTimeHours) * 100).toFixed(0) : '0';

  let executiveSummary = `O fluxo de "${projectName}" (${department}) possui um Lead Time total de aproximadamente ${leadTimeDays} dias úteis (${totalLeadTimeHours.toFixed(1)} horas), porém o esforço ativo real de trabalho agrega apenas ${processTimeDays} dias (${totalProcessHours.toFixed(1)} horas). Isso significa que ${waitPercentage}% do tempo total decorrido é desperdício puro de fila e espera (Muda de Espera).`;

  if (flowEfficiency < 5) {
    executiveSummary += ` A Eficiência de Fluxo de ${flowEfficiency.toFixed(1)}% está na zona crítica (típica de processos burocráticos), indicando que a equipe passa a maior parte do ciclo aguardando respostas, aprovações e conciliações de agenda.`;
  } else if (flowEfficiency < 15) {
    executiveSummary += ` A Eficiência de Fluxo de ${flowEfficiency.toFixed(1)}% é moderada para processos corporativos, com oportunidades claras de eliminação de tempos mortos.`;
  } else {
    executiveSummary += ` A Eficiência de Fluxo de ${flowEfficiency.toFixed(1)}% demonstra boa cadência de entrega com baixo tempo de fila relativo.`;
  }

  // 3. Key Insights
  const keyInsights: string[] = [];

  if (maxWaitStep) {
    const maxWtHours = convertTimeToHours(maxWaitStep.waitTime, maxWaitStep.waitTimeUnit, true);
    const wtPercent = totalWaitHours > 0 ? ((maxWtHours / totalWaitHours) * 100).toFixed(0) : '0';
    keyInsights.push(
      `Restrição Principal (Teoria das Restrições): A etapa #${maxWaitStep.order} ("${maxWaitStep.title}") responde sozinha por ${wtPercent}% de toda a fila do fluxo (${formatHours(maxWtHours)}). Qualquer melhoria fora desta etapa terá impacto mínimo no tempo total do cliente final.`
    );
  }

  if (lowestAccuracyStep && lowestAccuracyStep.percentCompleteAndAccurate < 85) {
    keyInsights.push(
      `Vazamento Oculto de Qualidade: A etapa #${lowestAccuracyStep.order} ("${lowestAccuracyStep.title}") tem apenas ${lowestAccuracyStep.percentCompleteAndAccurate}% de C&A. Isso gera um efeito cascata que derruba o rendimento final (RFPY) para ${overallYield.toFixed(1)}%, gerando retrabalhos invisíveis e devoluções constantes.`
    );
  }

  const parallelStages = metrics.parallelStagesCount || 0;
  const parallelCount = steps.filter(s => s.isParallel).length;
  if (parallelCount > 0) {
    keyInsights.push(
      `Atividades em Paralelo (Lean Office): O fluxo conta com ${parallelCount} etapa(s) simultânea(s) (${parallelStages > 0 ? `${parallelStages} bloco(s)` : 'concorrente(s)'}). O Lead Time e tempo de espera (WT) foram calculados pelo Caminho Crítico (maior tempo entre elas), garantindo que o tempo de calendário não seja inflado indevidamente.`
    );
  } else if (steps.length > 5) {
    keyInsights.push(
      `Oportunidade de Paralelismo: Todas as etapas estão 100% sequenciais. Há potencial para executar atividades de apoio (ex: exames, criação de acessos ou coleta documental) em paralelo para reduzir o Lead Time em até 30%.`
    );
  }

  // 4. Bottleneck Deep Dive
  let waitBottleneck = null;
  if (maxWaitStep) {
    const maxWtHours = convertTimeToHours(maxWaitStep.waitTime, maxWaitStep.waitTimeUnit, true);
    waitBottleneck = {
      stepTitle: maxWaitStep.title,
      role: maxWaitStep.role,
      waitTimeHours: maxWtHours,
      percentageOfLeadTime: totalLeadTimeHours > 0 ? Math.round((maxWtHours / totalLeadTimeHours) * 100) : 0,
      rootCauses: [
        'Dependência de agenda de gestores ou aprovações manuais sem SLA rígido',
        'Falta de critérios pré-alinhados que exigem reuniões repetitivas de esclarecimento',
        'Comunicação fragmentada por e-mail ou mensagens assíncronas sem visibilidade de fila'
      ],
      impact: `Consome ${(maxWtHours / HOURS_PER_WORK_DAY).toFixed(1)} dias úteis de espera passiva, gerando ansiedade no requisitante e risco de perda de prazos.`
    };
  }

  let qualityBottleneck = null;
  if (lowestAccuracyStep) {
    qualityBottleneck = {
      stepTitle: lowestAccuracyStep.title,
      role: lowestAccuracyStep.role,
      accuracy: lowestAccuracyStep.percentCompleteAndAccurate,
      reworkRisk: lowestAccuracyStep.percentCompleteAndAccurate < 70 ? 'Crítico (Alto Retrabalho)' : 'Moderado',
      rootCauses: [
        'Entrada de dados com campos opcionais ou formatos livres que permitem erros',
        'Ausência de checklist automatizado de validação na fonte (Poka-Yoke)',
        'Instruções vagas repassadas ao solicitante sem modelo de exemplo'
      ],
      impact: `Aproximadamente ${100 - lowestAccuracyStep.percentCompleteAndAccurate}% das demandas necessitam de devolução, ligações ou trocas de e-mails para correção.`
    };
  }

  // Max Process Time step
  let maxPtStep = steps[0];
  let maxPtHours = 0;
  steps.forEach(s => {
    const pt = convertTimeToHours(s.processTime, s.processTimeUnit, true);
    if (pt > maxPtHours) {
      maxPtHours = pt;
      maxPtStep = s;
    }
  });

  const effortBottleneck = maxPtStep
    ? {
        stepTitle: maxPtStep.title,
        role: maxPtStep.role,
        processTimeHours: maxPtHours,
        workloadRisk: maxPtHours > 3 ? 'Alto consumo de horas manuais' : 'Normal'
      }
    : null;

  // 5. Muda Breakdown
  const wasteCounts: Partial<Record<WasteType, number>> = {};
  steps.forEach(s => {
    s.wasteTypes?.forEach(w => {
      wasteCounts[w] = (wasteCounts[w] || 0) + 1;
    });
  });

  const mudaBreakdown = (Object.keys(WASTE_METAS) as WasteType[])
    .map(type => {
      const meta = WASTE_METAS[type];
      const count = wasteCounts[type] || 0;
      let action = 'Monitorar indicadores de fluxo.';
      if (type === 'espera') action = 'Implementar SLAs formais e escalonamento automático de pendências.';
      if (type === 'retrabalho') action = 'Criar travas no formulário inicial (Poka-Yoke) e validação de dados em tempo real.';
      if (type === 'superprocessamento') action = 'Eliminar assinaturas duplicadas e alçadas de baixo valor residual.';
      if (type === 'movimentacao') action = 'Centralizar interações em um canal único integrado (ATS/Portal).';
      if (type === 'excesso_informacao') action = 'Estabelecer limite de trabalho em progresso (WIP) nas caixas de entrada.';

      return {
        type,
        label: meta.label,
        count,
        description: meta.description,
        action
      };
    })
    .filter(m => m.count > 0 || m.type === 'espera' || m.type === 'retrabalho');

  // 6. Future State Simulation (Projeção do Estado Futuro Enxuto)
  // Simulating 60-75% reduction in wait time and 50% reduction in rework
  const projectedWaitHours = totalWaitHours * 0.3; // 70% wait reduction
  const projectedProcessHours = totalProcessHours * 0.85; // 15% effort optimization via templates
  const projectedLeadTimeHours = projectedProcessHours + projectedWaitHours;
  const leadTimeReductionPercent = totalLeadTimeHours > 0
    ? Math.round(((totalLeadTimeHours - projectedLeadTimeHours) / totalLeadTimeHours) * 100)
    : 0;

  const projectedFlowEfficiency = projectedLeadTimeHours > 0
    ? (projectedProcessHours / projectedLeadTimeHours) * 100
    : 0;

  // Projected Rolled Yield when low accuracy steps improve to >92%
  let projectedYieldRatio = 1;
  steps.forEach(s => {
    const acc = Math.max(s.percentCompleteAndAccurate, 92) / 100;
    projectedYieldRatio *= acc;
  });
  const projectedYield = Math.round(projectedYieldRatio * 100);

  const futureStateSimulation = {
    currentLeadTimeHours: totalLeadTimeHours,
    projectedLeadTimeHours,
    leadTimeReductionPercent,
    currentFlowEfficiency: flowEfficiency,
    projectedFlowEfficiency,
    currentYield: overallYield,
    projectedYield,
    summary: `Com a eliminação das filas nas etapas críticas e padronização das entradas, o tempo de entrega pode cair de ${(totalLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1)} para ${(projectedLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1)} dias úteis (${leadTimeReductionPercent}% de redução), elevando a Eficiência de Fluxo de ${flowEfficiency.toFixed(1)}% para ${projectedFlowEfficiency.toFixed(1)}%.`
  };

  // 7. Action Roadmap Dinâmico (Kaizen 30-60-90)
  // Gerado com base nas etapas reais, gargalos identificados e notas Kaizen da equipe
  const activeRoles = Array.from(new Set(steps.map(s => s.role).filter(Boolean)));
  const hasParallelSteps = steps.some(s => s.isParallel);

  // Fase 1: Quick Wins (0 a 30 dias) - Baixo esforço e impacto imediato
  const quickWins = [];

  // Ação 1: Atacar a etapa de maior espera (Gargalo Principal)
  if (maxWaitStep) {
    const wtHours = convertTimeToHours(maxWaitStep.waitTime, maxWaitStep.waitTimeUnit, true);
    quickWins.push({
      action: `Estipular Acordo de Nível de Serviço (SLA) de até 24h e escalonamento automático para a etapa #${maxWaitStep.order} ("${maxWaitStep.title}").`,
      impact: `Reduz em até 60% a fila de ${formatHours(wtHours)} sob responsabilidade de [${maxWaitStep.role}], sem custo adicional.`,
      effort: 'Baixo' as const,
      targetStep: `#${maxWaitStep.order} - ${maxWaitStep.title}`
    });
  } else {
    quickWins.push({
      action: `Mapear e limitar o tempo de permanência de tarefas na fila inicial de ${department}.`,
      impact: 'Reduz o tempo de resposta inicial para clientes internos.',
      effort: 'Baixo' as const,
      targetStep: 'Entrada de Demandas'
    });
  }

  // Ação 2: Atacar a pior etapa de qualidade (%C&A) com Poka-Yoke
  if (lowestAccuracyStep && lowestAccuracyStep.percentCompleteAndAccurate < 95) {
    quickWins.push({
      action: `Implementar checklist com travas de validação na origem (Poka-Yoke) para a etapa #${lowestAccuracyStep.order} ("${lowestAccuracyStep.title}").`,
      impact: `Eleva a qualidade da etapa de ${lowestAccuracyStep.percentCompleteAndAccurate}% para >92%, estancando devoluções e retrabalhos recorrentes.`,
      effort: 'Baixo' as const,
      targetStep: `#${lowestAccuracyStep.order} - ${lowestAccuracyStep.title}`
    });
  } else {
    quickWins.push({
      action: `Padronizar formulário de solicitação com campos mandatórios para os processos de "${projectName}".`,
      impact: 'Elimina trocas de mensagens para coletar informações pendentes.',
      effort: 'Baixo' as const,
      targetStep: 'Início do Fluxo'
    });
  }

  // Ação 3: Atender Kaizen Burst apontado pela equipe ou Gestão Visual
  if (allKaizens.length > 0) {
    const kItem = allKaizens[0];
    quickWins.push({
      action: `Executar Kaizen Burst prioritário: "${kItem.kaizen}" na etapa #${kItem.step.order} ("${kItem.step.title}").`,
      impact: `Soluciona diretamente a oportunidade apontada para [${kItem.step.role}] na dinâmica de mapeamento.`,
      effort: 'Baixo' as const,
      targetStep: `#${kItem.step.order} - ${kItem.step.title}`
    });
  } else {
    quickWins.push({
      action: `Adotar quadro Kanban visual com limite de itens em progresso (WIP) para a equipe de ${department}.`,
      impact: 'Proporciona transparência imediata sobre tarefas represadas e destrava gargalos.',
      effort: 'Baixo' as const,
      targetStep: 'Gestão Visual do Fluxo'
    });
  }

  // Fase 2: Melhorias Estruturais (30 a 60 dias) - Médio esforço, paralelismo e governança
  const structuralImprovements = [];

  // Melhoria 1: Paralelismo / Caminho Crítico
  if (hasParallelSteps) {
    structuralImprovements.push({
      action: `Equalizar a cadência de trabalho entre as atividades executadas em paralelo para otimizar o Caminho Crítico.`,
      impact: 'Elimina tempos de sincronização ociosos entre os diferentes responsáveis do fluxo.',
      effort: 'Médio' as const,
      targetStep: 'Blocos Concorrentes'
    });
  } else if (steps.length >= 3) {
    const targetIdx = Math.min(2, steps.length - 1);
    structuralImprovements.push({
      action: `Reestruturar o fluxo para executar tarefas secundárias em paralelo com a etapa #${steps[targetIdx].order} ("${steps[targetIdx].title}").`,
      impact: 'Reduz o Lead Time total em até 30% através da execução concomitante segundo o Lean Office.',
      effort: 'Médio' as const,
      targetStep: `#${steps[targetIdx].order} - ${steps[targetIdx].title}`
    });
  } else {
    structuralImprovements.push({
      action: `Revisar a sequência operacional do fluxo de "${projectName}" para balancear a carga de trabalho.`,
      impact: 'Distribui as demandas de forma equilibrada, evitando acúmulo em um único responsável.',
      effort: 'Médio' as const,
      targetStep: 'Sequenciamento do Processo'
    });
  }

  // Melhoria 2: Matriz de Alçadas / Segundo Kaizen ou Desburocratização
  if (allKaizens.length > 1) {
    const kItem2 = allKaizens[1];
    structuralImprovements.push({
      action: `Implantar plano de ação Kaizen: "${kItem2.kaizen}" na etapa #${kItem2.step.order} ("${kItem2.step.title}").`,
      impact: `Elimina atrito identificado na etapa #${kItem2.step.order} sob tutela de [${kItem2.step.role}].`,
      effort: 'Médio' as const,
      targetStep: `#${kItem2.step.order} - ${kItem2.step.title}`
    });
  } else {
    const rolesSample = activeRoles.slice(0, 3).join(', ') || 'equipes envolvidas';
    structuralImprovements.push({
      action: `Redesenhar a matriz de responsabilidades (RACI) e flexibilizar alçadas decisórias entre [${rolesSample}].`,
      impact: 'Elimina handoffs burocráticos e validações repetitivas de baixo valor agregado.',
      effort: 'Médio' as const,
      targetStep: 'Matriz de Alçadas e Aprovações'
    });
  }

  // Fase 3: Automação & Tecnologia (60 a 90 dias) - Alto impacto, integrações e Poka-Yoke
  const automationProjects = [];

  const midStep = steps.length > 0 ? steps[Math.floor(steps.length / 2)] : null;
  automationProjects.push({
    action: `Integrar sistemas corporativos via API / Webhook para alimentar automaticamente a etapa #${midStep?.order || 1} ("${midStep?.title || 'Processamento Principal'}").`,
    impact: 'Zera a digitação manual de dados, reduzindo o tempo de esforço (PT) a zero para tarefas operacionais.',
    effort: 'Médio' as const,
    targetStep: `#${midStep?.order || 1} - ${midStep?.title || 'Sistemas'}`
  });

  if (lowestAccuracyStep && lowestAccuracyStep.percentCompleteAndAccurate < 90) {
    automationProjects.push({
      action: `Desenvolver formulário inteligente com validação de dados em tempo real e captura automatizada para "${lowestAccuracyStep.title}".`,
      impact: 'Garante acurácia próxima a 98% (%C&A), eliminando devoluções de ponta a ponta.',
      effort: 'Alto' as const,
      targetStep: `#${lowestAccuracyStep.order} - ${lowestAccuracyStep.title}`
    });
  } else {
    automationProjects.push({
      action: `Disponibilizar portal de autoatendimento e notificações automáticas de status para os envolvidos em "${projectName}".`,
      impact: 'Gera rastreabilidade em tempo real e reduz consultas de acompanhamento em até 80%.',
      effort: 'Alto' as const,
      targetStep: 'Portal do Usuário / Autoatendimento'
    });
  }

  return {
    timestamp: new Date().toLocaleString('pt-BR'),
    projectName,
    department,
    maturityScore,
    maturityLabel,
    maturityColor,
    executiveSummary,
    keyInsights,
    bottleneckAnalysis: {
      waitBottleneck,
      qualityBottleneck,
      effortBottleneck
    },
    mudaBreakdown,
    futureStateSimulation,
    actionRoadmap: {
      quickWins,
      structuralImprovements,
      automationProjects
    }
  };
}
