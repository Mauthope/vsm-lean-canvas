import { NextRequest, NextResponse } from 'next/server';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import { generateVsmAiDiagnostic } from '@/lib/vsmAiDiagnostic';
import { HOURS_PER_WORK_DAY } from '@/lib/vsmCalculations';

interface RoadmapItem {
  action: string;
  impact: string;
  effort: 'Baixo' | 'Médio' | 'Alto';
  targetStep: string;
}

function normalizeRoadmapList(list: any, fallbackList: RoadmapItem[]): RoadmapItem[] {
  if (!Array.isArray(list) || list.length === 0) return fallbackList;
  return list.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return {
        action: item,
        impact: 'Otimização comprovada no fluxo',
        effort: idx === 0 ? 'Baixo' : idx === 1 ? 'Médio' : 'Alto',
        targetStep: 'Processo Geral'
      };
    }
    return {
      action: item?.action || 'Ação de melhoria Lean',
      impact: item?.impact || 'Eliminação de desperdício',
      effort: (item?.effort === 'Alto' || item?.effort === 'Médio' || item?.effort === 'Baixo') ? item.effort : 'Médio',
      targetStep: item?.targetStep || 'Etapa Crítica'
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, department, steps, metrics, focusArea, userApiKey } = body as {
      projectName: string;
      department: string;
      steps: VSMStep[];
      metrics: BottleneckAnalysis;
      focusArea?: 'all' | 'speed' | 'quality' | 'automation';
      userApiKey?: string;
    };

    // Priority for API keys: userApiKey (if passed from UI) or Vercel Environment Variables
    const openAiKey = userApiKey?.startsWith('sk-') ? userApiKey : process.env.OPENAI_API_KEY;
    const geminiKey = (userApiKey && !userApiKey.startsWith('sk-')) ? userApiKey : process.env.GEMINI_API_KEY;

    // Base dynamic heuristic report always ready as fallback or base
    const heuristicReport = generateVsmAiDiagnostic(
      projectName || 'Fluxo Operacional',
      department || 'Operações',
      steps || [],
      metrics,
      focusArea || 'all'
    );

    const commonSystemPrompt = `Você é um Consultor Sênior Master Black Belt especialista em Lean Six Sigma e Mapeamento de Fluxo de Valor (VSM) para processos corporativos, de RH e administrativos.
(Considere que 1 dia útil equivale a 8h48min ou 8.8 horas de trabalho).
Responda RIGOROSAMENTE em formato JSON puro, sem blocos de markdown adicionais.`;

    const commonUserPrompt = `Analise detalhadamente o seguinte Mapeamento de Fluxo de Valor (VSM):
- Nome do Projeto: ${projectName}
- Área/Departamento: ${department}
- Lead Time Total: ${(metrics.totalLeadTimeHours / HOURS_PER_WORK_DAY).toFixed(1)} dias úteis (${metrics.totalLeadTimeHours.toFixed(1)} horas)
- Tempo Ativo de Trabalho (PT): ${(metrics.totalProcessHours / HOURS_PER_WORK_DAY).toFixed(1)} dias úteis (${metrics.totalProcessHours.toFixed(1)} horas)
- Tempo em Fila/Espera (WT): ${(metrics.totalWaitHours / HOURS_PER_WORK_DAY).toFixed(1)} dias úteis (${metrics.totalWaitHours.toFixed(1)} horas)
- Eficiência de Fluxo (PT/LT): ${metrics.flowEfficiency.toFixed(1)}%
- Rendimento Cumulativo (%C&A Rolled Yield): ${metrics.overallYield.toFixed(1)}%
- Maior Gargalo de Espera: Etapa #${metrics.maxWaitStep?.order} - "${metrics.maxWaitStep?.title}" (${metrics.maxWaitStep?.waitTime} ${metrics.maxWaitStep?.waitTimeUnit}, responsável: ${metrics.maxWaitStep?.role})
- Pior Qualidade (%C&A): Etapa #${metrics.lowestAccuracyStep?.order} - "${metrics.lowestAccuracyStep?.title}" (${metrics.lowestAccuracyStep?.percentCompleteAndAccurate}%, responsável: ${metrics.lowestAccuracyStep?.role})

Etapas Mapeadas:
${(steps || []).map(s => `#${s.order} [${s.role}] "${s.title}" - PT: ${s.processTime} ${s.processTimeUnit} | WT: ${s.waitTime} ${s.waitTimeUnit} | %C&A: ${s.percentCompleteAndAccurate}% | Desperdícios: ${s.wasteTypes?.join(', ') || 'Nenhum'} | Kaizen: ${s.kaizenNotes || 'Nenhum'} | Paralelo: ${s.isParallel ? 'Sim' : 'Não'}`).join('\n')}

Forneça um diagnóstico executivo e um ROADMAP KAIZEN 30-60-90 DIAS 100% CUSTOMIZADO para "${projectName}" em formato JSON rigoroso:
{
  "executiveSummary": "Texto corrido de 1 parágrafo com veredito direto sobre a saúde do fluxo e proporção de desperdício.",
  "maturityScore": número de 15 a 95 indicando maturidade Lean,
  "maturityLabel": "Rótulo de maturidade (ex: Típico Corporativo, Maturidade Intermediária, Classe Mundial)",
  "keyInsights": ["Insight 1 focado no processo", "Insight 2 focado no gargalo", "Insight 3 focado em paralelismo ou qualidade"],
  "waitBottleneckDiagnosis": "Diagnóstico aprofundado da etapa de maior espera com causas raiz prováveis e impacto.",
  "qualityBottleneckDiagnosis": "Diagnóstico do impacto de retrabalho da etapa de pior %C&A.",
  "actionRoadmap": {
    "quickWins": [
      {"action": "Ação imediata 0 a 30 dias", "impact": "Impacto esperado", "effort": "Baixo", "targetStep": "Etapa alvo"}
    ],
    "structuralImprovements": [
      {"action": "Melhoria estrutural/paralelismo 30 a 60 dias", "impact": "Impacto esperado", "effort": "Médio", "targetStep": "Etapa alvo"}
    ],
    "automationProjects": [
      {"action": "Projeto de automação/sistema 60 a 90 dias", "impact": "Impacto esperado", "effort": "Alto", "targetStep": "Etapa alvo"}
    ]
  }
}`;

    // 1. If OpenAI Key is present, call OpenAI Chat Completions API
    if (openAiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: commonSystemPrompt },
              { role: 'user', content: commonUserPrompt }
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.choices[0].message.content);

          return NextResponse.json({
            ...heuristicReport,
            provider: 'OpenAI (GPT-4o-mini)',
            isLiveAi: true,
            executiveSummary: parsed.executiveSummary || heuristicReport.executiveSummary,
            maturityScore: parsed.maturityScore || heuristicReport.maturityScore,
            maturityLabel: parsed.maturityLabel || heuristicReport.maturityLabel,
            keyInsights: parsed.keyInsights && Array.isArray(parsed.keyInsights) ? parsed.keyInsights : heuristicReport.keyInsights,
            bottleneckAnalysis: {
              ...heuristicReport.bottleneckAnalysis,
              waitBottleneck: heuristicReport.bottleneckAnalysis.waitBottleneck ? {
                ...heuristicReport.bottleneckAnalysis.waitBottleneck,
                impact: parsed.waitBottleneckDiagnosis || heuristicReport.bottleneckAnalysis.waitBottleneck.impact
              } : null,
              qualityBottleneck: heuristicReport.bottleneckAnalysis.qualityBottleneck ? {
                ...heuristicReport.bottleneckAnalysis.qualityBottleneck,
                impact: parsed.qualityBottleneckDiagnosis || heuristicReport.bottleneckAnalysis.qualityBottleneck.impact
              } : null
            },
            actionRoadmap: {
              quickWins: normalizeRoadmapList(parsed.actionRoadmap?.quickWins || parsed.quickWins, heuristicReport.actionRoadmap.quickWins),
              structuralImprovements: normalizeRoadmapList(parsed.actionRoadmap?.structuralImprovements, heuristicReport.actionRoadmap.structuralImprovements),
              automationProjects: normalizeRoadmapList(parsed.actionRoadmap?.automationProjects, heuristicReport.actionRoadmap.automationProjects)
            }
          });
        }
      } catch (err) {
        console.warn('Falha na chamada OpenAI, tentando outros provedores:', err);
      }
    }

    // 2. If Gemini Key is present, call Google Gemini API with model fallback
    if (geminiKey) {
      const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

      for (const model of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${commonSystemPrompt}\n\n${commonUserPrompt}` }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            // Strip markdown code fences if present
            rawText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

            if (rawText) {
              const parsed = JSON.parse(rawText);
              const rawInsights = parsed.keyInsights && Array.isArray(parsed.keyInsights)
                ? parsed.keyInsights
                : (typeof parsed.keyInsights === 'string' ? [parsed.keyInsights] : heuristicReport.keyInsights);

              return NextResponse.json({
                ...heuristicReport,
                provider: `Google Gemini (${model})`,
                isLiveAi: true,
                executiveSummary: parsed.executiveSummary || heuristicReport.executiveSummary,
                maturityScore: parsed.maturityScore || heuristicReport.maturityScore,
                maturityLabel: parsed.maturityLabel || heuristicReport.maturityLabel,
                keyInsights: rawInsights,
                bottleneckAnalysis: {
                  ...heuristicReport.bottleneckAnalysis,
                  waitBottleneck: heuristicReport.bottleneckAnalysis.waitBottleneck ? {
                    ...heuristicReport.bottleneckAnalysis.waitBottleneck,
                    impact: parsed.waitBottleneckDiagnosis || heuristicReport.bottleneckAnalysis.waitBottleneck.impact
                  } : null,
                  qualityBottleneck: heuristicReport.bottleneckAnalysis.qualityBottleneck ? {
                    ...heuristicReport.bottleneckAnalysis.qualityBottleneck,
                    impact: parsed.qualityBottleneckDiagnosis || heuristicReport.bottleneckAnalysis.qualityBottleneck.impact
                  } : null
                },
                actionRoadmap: {
                  quickWins: normalizeRoadmapList(parsed.actionRoadmap?.quickWins || parsed.quickWins, heuristicReport.actionRoadmap.quickWins),
                  structuralImprovements: normalizeRoadmapList(parsed.actionRoadmap?.structuralImprovements, heuristicReport.actionRoadmap.structuralImprovements),
                  automationProjects: normalizeRoadmapList(parsed.actionRoadmap?.automationProjects, heuristicReport.actionRoadmap.automationProjects)
                }
              });
            }
          } else {
            console.warn(`Gemini modelo ${model} retornou status ${res.status}`);
          }
        } catch (geminiErr) {
          console.warn(`Erro ao chamar modelo ${model} do Gemini:`, geminiErr);
        }
      }
    }

    // 3. Fallback: Built-in Intelligent Heuristic Diagnostic Engine (now 100% dynamic)
    return NextResponse.json({
      ...heuristicReport,
      provider: 'Motor Especialista Lean Six Sigma Integrado',
      isLiveAi: false,
      note: 'Para conectar modelos GPT ou Gemini em tempo real, defina a variável GEMINI_API_KEY ou OPENAI_API_KEY na Vercel ou insira a chave no painel de IA.'
    });
  } catch (error) {
    console.error('Erro na rota de diagnóstico IA:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar diagnóstico de IA.' },
      { status: 500 }
    );
  }
}
