# ⚡ VSM Lean Canvas

> **Whiteboard Estruturado & Canvas de Mapeamento de Fluxo de Valor (VSM) para Processos Corporativos, RH e Administrativos**

Aplicação web moderna, interativa e de alta fidelidade desenvolvida em **Next.js (App Router)**, **TypeScript** e **Tailwind CSS v4**, adotando o **Industrial Precision UI/UX Design System (BagTime Reference)**.

Desenvolvido para consultores Lean conduzirem workshops e dinâmicas ao vivo de mapeamento com equipes corporativas.

---

## 🚀 Principais Funcionalidades

- 📋 **Whiteboard Estruturado / Canvas VSM**:
  - Esteira horizontal dinâmica com cartões visuais de cada etapa.
  - Conectores de fluxo com indicação visual de Tempo de Espera (WT) e setas de transição.
  - Botão de inserção rápida `+` diretamente entre etapas durante a entrevista com o time.
  - Suporte a ramificação paralela (`isParallel: true`).
- ⏱️ **Régua de Dente de Serra (VSM Timeline Ladder)**:
  - O clássico degrau superior de tempo sem valor agregado / espera (WT).
  - O dente inferior de tempo com valor agregado / esforço real (PT).
  - Consolidação comparativa final de tempos.
- 📊 **5 Cards de KPI Industriais BagTime**:
  - **Lead Time Total (LT)**: tempo de ponta a ponta em horas e dias úteis.
  - **Tempo de Esforço (PT)**: esforço líquido real.
  - **Eficiência de Fluxo (FE)**: $PT / LT \times 100\%$ com indicador de saúde e benchmarking Lean.
  - **Rolled First Pass Yield (RFPY)**: $\prod (\%C\&A)$ revelando a perda oculta acumulada de retrabalho.
  - **Alerta de Gargalo Crítico**: identificação instantânea da maior fila de espera e pior qualidade.
- 💡 **Raios de Kaizen (Kaizen Bursts)**:
  - Registro de oportunidades de melhoria por etapa.
  - Painel lateral (*drawer*) consolidado com exportação para plano de ação 5W2H.
- 📑 **Relatório Executivo Lean**:
  - Diagnóstico pronto para cópia em Markdown ou impressão em PDF.
- 🎯 **Modelos Prontos de RH & Administrativo**:
  - *Recrutamento & Seleção (R&S)* (10 etapas com gargalos reais).
  - *Admissão & Onboarding de Colaborador* (com etapas paralelas de TI e DP).
  - *Requisição de Compras & Capex* (cotações e alçadas de aprovação).
  - *Canvas em Branco*.
- 💾 **Persistência & Backup**:
  - Salvamento automático em tempo real no `localStorage`.
  - Exportação e importação de projetos em arquivos `.json`.

---

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Design System**: Industrial Precision UI (BagTime Reference)

---

## 📦 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:3000
```

---

## 👤 Autor

Criado por **Mauricio Grigol**  
Consultoria Lean & Engenharia de Processos
