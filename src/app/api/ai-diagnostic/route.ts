import { NextRequest, NextResponse } from 'next/server';
import { VSMStep, BottleneckAnalysis } from '@/types/vsm';
import { generateVsmAiDiagnostic } from '@/lib/vsmAiDiagnostic';

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

    // Build the fallback heuristic report first
    const heuristicReport = generateVsmAiDiagnostic(
      projectName || 'Mapeamento VSM',
      department || 'Corporativo',
      steps || [],
      metrics,
      focusArea || 'all'
    );

    // 1. If OpenAI Key is present, call OpenAI Chat Completions API
    if (openAiKey) {
      try {
        const prompt = `Você é um Consultor Sênior Master Black Belt especialista em Lean Six Sigma e Mapeamento de Fluxo de Valor (VSM) para processos corporativos, de RH e administrativos.

Analise o seguinte Mapeamento de Fluxo de Valor (VSM):
- Nome do Projeto: ${projectName}
- Área/Departamento: ${department}
- Lead Time Total: ${(metrics.totalLeadTimeHours / 8).toFixed(1)} dias úteis (${metrics.totalLeadTimeHours.toFixed(1)} horas)
- Tempo Ativo de Trabalho (PT): ${(metrics.totalProcessHours / 8).toFixed(1)} dias úteis (${metrics.totalProcessHours.toFixed(1)} horas)
- Tempo em Fila/Espera (WT): ${(metrics.totalWaitHours / 8).toFixed(1)} dias úteis (${metrics.totalWaitHours.toFixed(1)} horas)
- Eficiência de Fluxo (PT/LT): ${metrics.flowEfficiency.toFixed(1)}%
- Rendimento Cumulativo (%C&A Rolled Yield): ${metrics.overallYield.toFixed(1)}%
- Maior Gargalo de Espera: Etapa #${metrics.maxWaitStep?.order} - "${metrics.maxWaitStep?.title}" (${metrics.maxWaitStep?.waitTime} ${metrics.maxWaitStep?.waitTimeUnit})
- Pior Qualidade (%C&A): Etapa #${metrics.lowestAccuracyStep?.order} - "${metrics.lowestAccuracyStep?.title}" (${metrics.lowestAccuracyStep?.percentCompleteAndAccurate}%)

Etapas Mapeadas:
${steps.map(s => `#${s.order} [${s.role}] "${s.title}" - PT: ${s.processTime} ${s.processTimeUnit} | WT: ${s.waitTime} ${s.waitTimeUnit} | %C&A: ${s.percentCompleteAndAccurate}% | Desperdícios: ${s.wasteTypes?.join(', ') || 'Nenhum'} | Kaizen: ${s.kaizenNotes || 'Nenhum'}`).join('\n')}

Forneça um diagnóstico executivo detalhado em formato JSON rigoroso com a seguinte estrutura:
{
  "executiveSummary": "Texto corrido de 1 parágrafo com veredito direto sobre a saúde do processo e proporção de desperdício.",
  "maturityScore": número de 15 a 95 indicando maturidade Lean,
  "maturityLabel": "Rótulo de maturidade (ex: Típico Corporativo, Classe Mundial, etc.)",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "waitBottleneckDiagnosis": "Diagnóstico aprofundado da etapa de maior espera com causas raiz prováveis e impacto.",
  "qualityBottleneckDiagnosis": "Diagnóstico do impacto de retrabalho da etapa de pior %C&A.",
  "futureStateProjection": "Projeção do estado futuro após eliminar filas e automatizar entradas.",
  "quickWins": [
    {"action": "Ação imediata", "impact": "Impacto esperado", "effort": "Baixo", "targetStep": "Etapa alvo"}
  ]
}
Retorne APENAS o JSON válido sem blocos de código adicionais.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um consultor executivo Lean Six Sigma e responde apenas em JSON válido.' },
              { role: 'user', content: prompt }
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
            keyInsights: parsed.keyInsights && Array.isArray(parsed.keyInsights) ? parsed.keyInsights : heuristicReport.keyInsights
          });
        }
      } catch (err) {
        console.warn('Falha na chamada OpenAI, utilizando motor heurístico integrado:', err);
      }
    }

    // 2. If Gemini Key is present, call Google Gemini API
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const prompt = `Você é um Consultor Sênior Master Black Belt em Lean Six Sigma.
Analise o VSM:
Projeto: ${projectName} (${department})
Lead Time: ${(metrics.totalLeadTimeHours / 8).toFixed(1)}d | Eficiência: ${metrics.flowEfficiency.toFixed(1)}% | RFPY (%C&A): ${metrics.overallYield.toFixed(1)}%
Gargalo Espera: #${metrics.maxWaitStep?.order} ${metrics.maxWaitStep?.title} (${metrics.maxWaitStep?.waitTime} ${metrics.maxWaitStep?.waitTimeUnit})
Pior %C&A: #${metrics.lowestAccuracyStep?.order} ${metrics.lowestAccuracyStep?.title} (${metrics.lowestAccuracyStep?.percentCompleteAndAccurate}%)

Responda em JSON válido com:
{
  "executiveSummary": "Veredito executivo de 1 parágrafo.",
  "maturityScore": 50,
  "maturityLabel": "Típico Corporativo",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return NextResponse.json({
              ...heuristicReport,
              provider: 'Google Gemini (1.5 Flash)',
              isLiveAi: true,
              executiveSummary: parsed.executiveSummary || heuristicReport.executiveSummary,
              maturityScore: parsed.maturityScore || heuristicReport.maturityScore,
              maturityLabel: parsed.maturityLabel || heuristicReport.maturityLabel,
              keyInsights: parsed.keyInsights || heuristicReport.keyInsights
            });
          }
        }
      } catch (err) {
        console.warn('Falha na chamada Gemini, utilizando motor heurístico integrado:', err);
      }
    }

    // 3. Fallback: Built-in Intelligent Heuristic Diagnostic Engine
    return NextResponse.json({
      ...heuristicReport,
      provider: 'Motor Especialista Lean Six Sigma Integrado',
      isLiveAi: false,
      note: 'Para conectar modelos GPT ou Gemini em tempo real, defina a variável OPENAI_API_KEY ou GEMINI_API_KEY na Vercel.'
    });
  } catch (error) {
    console.error('Erro na rota de diagnóstico IA:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar diagnóstico de IA.' },
      { status: 500 }
    );
  }
}
