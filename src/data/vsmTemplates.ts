import { VSMTemplate } from '@/types/vsm';

export const VSM_TEMPLATES: VSMTemplate[] = [
  {
    id: 'template-rs',
    name: 'Recrutamento & Seleção (R&S)',
    department: 'Recursos Humanos / Talent Acquisition',
    description: 'Fluxo ponta a ponta desde a aprovação do perfil da vaga até o aceite da proposta e exame admissional.',
    steps: [
      {
        order: 1,
        title: 'Alinhamento de Perfil e Abertura da Vaga',
        role: 'Gestor Requisitante',
        description: 'Preenchimento do formulário de requisição e reunião de briefing com a equipe de recrutamento.',
        processTime: 45,
        processTimeUnit: 'minutos',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 80,
        wasteTypes: ['excesso_informacao', 'espera'],
        kaizenNotes: 'Criar briefing padrão interativo com competências pré-cadastradas para evitar 2ª reunião de alinhamento.'
      },
      {
        order: 2,
        title: 'Divulgação em Canais e Plataforma ATS',
        role: 'Recrutador',
        description: 'Parametrização da vaga no software de atração, LinkedIn e sites parceiros.',
        processTime: 30,
        processTimeUnit: 'minutos',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 95,
        wasteTypes: ['superprocessamento'],
        kaizenNotes: 'Integrar ATS com autopublicação em redes sociais em lote.'
      },
      {
        order: 3,
        title: 'Triagem Curricular e Hunting Ativo',
        role: 'Recrutador',
        description: 'Análise de currículos inscritos e abordagem ativa de candidatos aderentes.',
        processTime: 3,
        processTimeUnit: 'horas',
        waitTime: 2,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 75,
        wasteTypes: ['excesso_informacao', 'espera'],
        kaizenNotes: 'Piloto de IA para triagem automática dos primeiros 50 currículos com base em palavras-chave mandatórias.'
      },
      {
        order: 4,
        title: 'Entrevista Inicial de Fit Cultural (RH)',
        role: 'Recrutador',
        description: 'Alinhamento de expectativas salariais, disponibilidade e histórico profissional.',
        processTime: 1,
        processTimeUnit: 'horas',
        waitTime: 3,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 90,
        wasteTypes: ['espera'],
        kaizenNotes: 'Adotar ferramenta de autoagendamento tipo Calendly para eliminar troca de e-mails de conciliação de agenda.'
      },
      {
        order: 5,
        title: 'Entrevista Técnica com Gestor da Área',
        role: 'Gestor',
        description: 'Avaliação técnica aprofundada das entregas e desafios da posição.',
        processTime: 1,
        processTimeUnit: 'horas',
        waitTime: 4,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 85,
        wasteTypes: ['espera', 'movimentacao'],
        kaizenNotes: '🚨 GARGALO CRÍTICO: Gestores demoram até 4 dias para dar feedback da entrevista. Implementar SLA corporativo de 48h com lembrete no Teams.'
      },
      {
        order: 6,
        title: 'Avaliação de Case Técnico Prático',
        role: 'Gestor',
        description: 'Envio do case para resolução em casa e validação da aderência técnica.',
        processTime: 2,
        processTimeUnit: 'horas',
        waitTime: 3,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 70,
        wasteTypes: ['retrabalho', 'espera'],
        kaizenNotes: 'Padronizar gabarito e rubrica de notas para diminuir dúvidas e reavaliações.'
      },
      {
        order: 7,
        title: 'Elaboração e Aprovação da Carta Proposta',
        role: 'Recrutador',
        description: 'Simulação salarial, benefícios e validação da tabela com a gerência de RH.',
        processTime: 30,
        processTimeUnit: 'minutos',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 95,
        wasteTypes: ['espera']
      },
      {
        order: 8,
        title: 'Aceite Formal da Proposta',
        role: 'Candidato',
        description: 'Recebimento formal do aceite e definição da data de início (aviso prévio).',
        processTime: 15,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 90,
        wasteTypes: ['espera']
      },
      {
        order: 9,
        title: 'Agendamento de Exame Admissional (ASO)',
        role: 'DP',
        description: 'Emissão da guia de encaminhamento e agendamento na clínica credenciada.',
        processTime: 40,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 80,
        isParallel: true,
        wasteTypes: ['movimentacao', 'espera'],
        kaizenNotes: 'Conectar clínica parceira via API para envio automático de guias sem anexos manuais.'
      },
      {
        order: 10,
        title: 'Envio de Documentos pelo Candidato',
        role: 'Candidato',
        description: 'Fotografia e envio de RG, CPF, Carteira de Trabalho e comprovante de residência.',
        processTime: 45,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 75,
        isParallel: true,
        wasteTypes: ['retrabalho'],
        kaizenNotes: 'Implementar validação automática de qualidade de foto e campos obrigatórios no portal.'
      },
      {
        order: 11,
        title: 'Encerramento no ATS e Liberação para Admissão',
        role: 'Recrutador',
        description: 'Envio do pacote de dados do candidato aprovado para a esteira de Departamento Pessoal.',
        processTime: 20,
        processTimeUnit: 'minutos',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 98,
        wasteTypes: ['superprocessamento']
      }
    ]
  },
  {
    id: 'template-onboarding',
    name: 'Admissão & Onboarding de Colaborador',
    department: 'Departamento Pessoal & TI',
    description: 'Validação documental, preparação de acessos em paralelo e integração corporativa.',
    steps: [
      {
        order: 1,
        title: 'Envio do Link de Admissão Digital',
        role: 'DP',
        description: 'Disparo de link criptografado para o novo colaborador carregar sua documentação.',
        processTime: 15,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 98,
        wasteTypes: []
      },
      {
        order: 2,
        title: 'Upload de Documentos pelo Colaborador',
        role: 'Colaborador',
        description: 'Fotografia e envio de RG, CPF, Título, PIS, Comprovante de Residência e Carteira de Trabalho.',
        processTime: 50,
        processTimeUnit: 'minutos',
        waitTime: 3,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 65,
        wasteTypes: ['retrabalho', 'espera'],
        kaizenNotes: '🚨 GARGALO DE QUALIDADE (%C&A 65%): Fotos cortadas ou ilegíveis causam alto retrabalho. Adicionar OCR com validação imediata de nitidez no aplicativo.'
      },
      {
        order: 3,
        title: 'Auditoria Documental & Qualificação eSocial',
        role: 'DP',
        description: 'Conferência de certidões, divergência na Receita Federal e cadastro na folha de pagamento.',
        processTime: 1.5,
        processTimeUnit: 'horas',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 75,
        wasteTypes: ['retrabalho', 'superprocessamento']
      },
      {
        order: 4,
        title: 'Preparação & Configuração de Notebook',
        role: 'TI',
        description: 'Instalação de imagem padrão de sistema operacional, antivírus, VPN e softwares.',
        processTime: 2,
        processTimeUnit: 'horas',
        waitTime: 4,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 90,
        isParallel: true,
        wasteTypes: ['espera'],
        kaizenNotes: 'Manter buffer de 3 máquinas preparadas (estoque enxuto) para reduzir tempo de espera da TI de 4 dias para zero.'
      },
      {
        order: 5,
        title: 'Criação de Acessos de E-mail & ERP',
        role: 'TI',
        description: 'Criação no Active Directory, concessão de licenças Office e perfis no sistema de gestão.',
        processTime: 45,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 82,
        isParallel: true,
        wasteTypes: ['movimentacao', 'espera'],
        kaizenNotes: 'Integrar solicitação do DP ao AD via Webhook com criação automática por perfil de cargo.'
      },
      {
        order: 6,
        title: 'Assinatura Digital do Contrato de Trabalho',
        role: 'Colaborador',
        description: 'Assinatura via plataforma Gov.br ou Docusign do contrato e termos de confidencialidade.',
        processTime: 20,
        processTimeUnit: 'minutos',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 95,
        wasteTypes: ['espera']
      },
      {
        order: 7,
        title: 'Sessão de Integração Institucional (Boas-vindas)',
        role: 'RH',
        description: 'Apresentação da cultura, benefícios, políticas de segurança e entrega do kit de boas-vindas.',
        processTime: 4,
        processTimeUnit: 'horas',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 98,
        wasteTypes: []
      },
      {
        order: 8,
        title: 'Entrega Técnica e Acolhimento na Área de Trabalho',
        role: 'Gestor',
        description: 'Apresentação ao time, entrega do plano de metas de 30-60-90 dias e designação de buddy.',
        processTime: 4,
        processTimeUnit: 'horas',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 88,
        wasteTypes: ['excesso_informacao']
      }
    ]
  },
  {
    id: 'template-compras',
    name: 'Requisição & Compras Administrativas',
    department: 'Suprimentos & Administrativo',
    description: 'Mapeamento do fluxo de solicitação de materiais, cotações com fornecedores e aprovações de alçada.',
    steps: [
      {
        order: 1,
        title: 'Abertura de Requisição de Compra (RC)',
        role: 'Gestor Requisitante',
        description: 'Especificação técnica do material/serviço com centro de custo e justificativa de negócio.',
        processTime: 30,
        processTimeUnit: 'minutos',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 72,
        wasteTypes: ['retrabalho', 'excesso_informacao'],
        kaizenNotes: 'Especificações vagas geram 28% de devolução pelo time de compras. Criar campos mandatórios de escopo.'
      },
      {
        order: 2,
        title: 'Cotação com 3 Fornecedores Homologados',
        role: 'Compras',
        description: 'Envio de RFQ, cobrança de propostas comerciais e negociação de prazo de pagamento.',
        processTime: 3,
        processTimeUnit: 'horas',
        waitTime: 5,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 85,
        wasteTypes: ['espera', 'movimentacao'],
        kaizenNotes: '🚨 MAIOR TEMPO DE FILA (5 dias aguardando fornecedor). Criar tabela de preços acordada e catálogo pré-aprovado.'
      },
      {
        order: 3,
        title: 'Equalização Técnica e Comercial',
        role: 'Compras',
        description: 'Montagem do mapa comparativo de preços, tributos, frete e garantia.',
        processTime: 1.5,
        processTimeUnit: 'horas',
        waitTime: 1,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 92,
        wasteTypes: ['superprocessamento']
      },
      {
        order: 4,
        title: 'Aprovação Orçamentária (Financeiro)',
        role: 'Financeiro',
        description: 'Conferência de saldo orçamentário e fluxo de caixa da competência.',
        processTime: 20,
        processTimeUnit: 'minutos',
        waitTime: 3,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 90,
        wasteTypes: ['espera'],
        kaizenNotes: 'Alçada automática para compras rotineiras abaixo de R$ 5.000 sem passar pelo financeiro.'
      },
      {
        order: 5,
        title: 'Aprovação de Diretoria (Acima de Alçada)',
        role: 'Diretoria',
        description: 'Validação estratégica e assinatura digital do pedido de compras.',
        processTime: 15,
        processTimeUnit: 'minutos',
        waitTime: 4,
        waitTimeUnit: 'dias',
        percentCompleteAndAccurate: 95,
        wasteTypes: ['espera', 'superprocessamento']
      },
      {
        order: 6,
        title: 'Emissão e Envio do Pedido de Compra (PO)',
        role: 'Compras',
        description: 'Geração do pedido no ERP e envio do PDF com termo de aceite para o fornecedor.',
        processTime: 30,
        processTimeUnit: 'minutos',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 99,
        wasteTypes: []
      }
    ]
  },
  {
    id: 'template-blank',
    name: 'Canvas em Branco (Novo Workshop)',
    department: 'Corporativo',
    description: 'Inicie uma sessão de mapeamento do zero durante uma dinâmica com o time.',
    steps: [
      {
        order: 1,
        title: 'Etapa Inicial do Processo',
        role: 'Gestor',
        description: 'Descreva a primeira atividade que dá início a este fluxo de valor.',
        processTime: 30,
        processTimeUnit: 'minutos',
        waitTime: 2,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 90,
        wasteTypes: ['espera']
      },
      {
        order: 2,
        title: 'Etapa Seguinte',
        role: 'RH',
        description: 'Descreva a próxima atividade executada no fluxo.',
        processTime: 1,
        processTimeUnit: 'horas',
        waitTime: 4,
        waitTimeUnit: 'horas',
        percentCompleteAndAccurate: 85,
        wasteTypes: ['movimentacao']
      }
    ]
  }
];
