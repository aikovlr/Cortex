# Cortex Front-End — Interface Web Corporativa

Aplicação web moderna para gerenciamento transacional de tarefas, equipes, metas e colaboração corporativa, desenvolvida em **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **CSS Modules**. O sistema é totalmente integrado à API RESTful do **Cortex Backend** e projetado em estrita conformidade com os requisitos do **Project Charter**, **Design System** institucional e diretrizes de acessibilidade **WCAG 2.1 AA**.

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [Autenticação e Acesso](#1-autenticação-e-acesso)
  - [Minhas Tarefas](#2-minhas-tarefas)
  - [Tarefas Atribuídas](#3-tarefas-atribuídas)
  - [Gestão de Equipes](#4-gestão-de-equipes)
  - [Metas e Gamificação](#5-metas-e-gamificação)
  - [Central de Relatórios & Exportação PDF](#6-central-de-relatórios--exportação-pdf)
  - [Configurações e Perfil](#7-configurações-e-perfil)
  - [Central de Notificações](#8-central-de-notificações)
- [Design System & Acessibilidade](#-design-system--acessibilidade)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração e Instalação](#-configuração-e-instalação)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#passo-a-passo)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Integração com a API Backend](#-integração-com-a-api-backend)

---

## 🎯 Visão Geral

O **Cortex Frontend** foi arquitetado como uma Single Page Application (SPA) com Server-Side Rendering (SSR) e Hydration otimizada, oferecendo alta performance, confiabilidade e ergonomia visual. A interface unifica fluxos de trabalho colaborativos em empresas e equipes ágeis, fornecendo desde o controle individual de tarefas até painéis consolidados de métricas e relatórios gerenciais com exportação gráfica em PDF.

---

## 🛠 Tecnologias Utilizadas

- **Next.js 16.3.4 (App Router)**: Roteamento baseado em pastas, layouts aninhados e Server/Client Components.
- **React 19.2.8 & React Compiler**: Biblioteca de componentes reativos com suporte a compilação automática para eliminação de memoizações manuais redundantes.
- **TypeScript 5.x**: Tipagem estática rigorosa de DTOs, entidades, estados de formulários e contratos de API.
- **CSS Modules & Vanilla CSS Tokens**: Isolamento de escopo estilístico sem dependência de frameworks pesados, garantindo carregamento ultrarrápido e controle total sobre tokens de design.
- **Context API (React)**: Gerenciamento desacoplado de estado global dividido em quatro contextos especialistas:
  - `AuthContext`: Estado de sessão, usuário logado e lifecycle de autenticação.
  - `AccessibilityContext`: Gestão de tema (`light`, `dark`), modo de alto contraste (`high-contrast`), escala de fontes com range de 12px a 24px (somente números pares) e sincronização multi-dispositivo em nuvem.
  - `NotificationContext`: Sincronização em tempo real e operações da central de notificações persistidas no banco.
  - `ToastContext`: Sistema unificado de alertas e feedback visual transitório.
- **pnpm**: Gerenciador de pacotes performático e determinístico via lockfile.

---

## 🚀 Funcionalidades Principais

### 1. Autenticação e Acesso
- **Login (`/login`)**: Autenticação com e-mail e senha, rate-limiting preventivo, tratamento de erros RFC 7807 (`ProblemDetails`) e suporte nativo a cookies de sessão `HttpOnly; Secure; SameSite=None`.
- **Registro (`/registro`)**: Criação de contas de usuário com validação de força de senha no padrão corporativo.
- **Proteção de Rotas**: Redirecionamento automático no `DashboardLayout` para usuários não autenticados.

### 2. Minhas Tarefas
- **Visão Geral (`/minhas-tarefas`)**: Listagem consolidada de todas as tarefas sob responsabilidade do usuário autenticado.
- **Filtragem e Pesquisa**: Busca textual por título/descrição e filtros rápidos por status (`Pendente`, `Atrasada`, `Concluída`) e prioridade (`Baixa`, `Média`, `Alta`, `Urgente`).
- **Detalhes da Tarefa (`/minhas-tarefas/[id]`)**:
  - Visualização de metadados, prazos, criador e pontuação.
  - **Entrega de Respostas**: Envio de devolutivas de execução com múltiplos arquivos anexados.
  - **Galeria de Anexos**: Pré-visualização integrada de imagens, documentos PDF e arquivos do Office com suporte a modal lightbox.
  - **Sugestões de Alteração (RN14)**: Envio de solicitações de ajuste para avaliação do criador da tarefa.
  - **Tickets de Dúvida/Reporte (RF008)**: Canal direto de suporte com o criador ou equipe para desbloqueio operacional.
  - **Ação de Conclusão e Cancelamento**: Conclusão da tarefa com um clique ou cancelamento/reversão da conclusão caso ajustes adicionais sejam necessários.

### 3. Tarefas Atribuídas
- **Painel do Criador (`/tarefas-atribuidas`)**: Gestão centralizada de todas as tarefas criadas pelo usuário autenticado e delegadas a outros colaboradores ou equipes.
- **Criação Rápida de Tarefas**: Modal dedicado com upload de arquivos, seleção múltipla de responsáveis, associação a equipes e definição de prazo com validação de data futura.
- **Avaliação de Entregas (`/tarefas-atribuidas/[id]`)**:
  - Auditoria das respostas e anexos submetidos pelos responsáveis.
  - **Atribuição de Notas**: Avaliação quantitativa da entrega do colaborador respeitando o teto de pontuação da tarefa.
  - **Moderação de Sugestões**: Aprovação ou reprovação de sugestões de mudança enviadas pelos executores.
  - **Gestão de Tickets**: Encerramento de tickets abertos vinculados à tarefa.

### 4. Gestão de Equipes
- **Listagem de Equipes (`/equipes`)**: Painel de equipes nas quais o usuário participa com distinção visual de cargos (`Dono`, `Admin`, `Membro`).
- **Criação de Equipes**: Cadastro dinâmico de novas equipes de trabalho.
- **Detalhes da Equipe (`/equipes/[id]`)**:
  - Tabela de membros com informações de contato e papel hierárquico.
  - Adição de novos membros via e-mail com atribuição imediata de cargo.
  - Alteração de cargo e remoção de participantes (com proteção hierárquica para Donos/Admins).
  - Listagem dos tickets de suporte vinculados às tarefas do time.

### 5. Metas e Gamificação
- **Painel de Metas (`/metas`)**: Acompanhamento visual de objetivos corporativos e metas individuais.
- **Progresso Dinâmico**: Cálculo automático do percentual de conclusão baseado nas tarefas vinculadas.
- **Ordenação por Criticidade**: Algoritmo de priorização automática que posiciona metas no topo da lista pela ordem `Atrasada` > `Pendente` > `Concluída`.
- **Criação e Vinculação de Metas**: Criação de metas com título, descrição, prazo e associação a tarefas existentes.

### 6. Central de Relatórios & Exportação PDF
- **Dashboard de BI e Métricas (`/relatorios`)**:
  - Filtros combinados por Equipe, Responsável, Criador, Status da Tarefa, Nível de Prioridade e Período (Data Inicial e Final).
  - Painéis de KPIs: Taxa de conclusão percentual, total de tarefas analisadas, contadores de pendências e atrasos.
  - Gráficos visuais de colunas e barras de progresso renderizados em CSS puro de alta fidelidade.
- **Exportação Profissional em PDF**:
  - Modal estilizado para visualização prévia da impressão.
  - Geração de documento PDF paginado, com cabeçalho institucional, sumário executivo, gráficos de barras incorporados e tabela analítica de tarefas.

### 7. Configurações e Perfil
- **Painel do Usuário (`/configuracoes`)**:
  - **Dados Pessoais**: Edição de nome completo, e-mail e telefone de contato.
  - **Foto de Perfil**: Upload de nova foto (JPEG, PNG, WebP) com compressão e pré-visualização, além de botão dedicado para remoção imediata da foto atual.
  - **Segurança de Acesso**: Formulário para alteração de senha exigindo validação da senha atual e confirmação da nova senha.
  - **Preferências de Notificação**: Configuração personalizada de canais ativos (`Email`, `Push`, `SMS`) e horas de antecedência para alertas de vencimento (1h a 168h).
  - **Acessibilidade e Temas**: Alternância dinâmica entre tema **Claro** e **Escuro**, ativação de **Alto Contraste**, seletor tipográfico com range de **12px a 24px (somente números pares: 12, 14, 16, 18, 20, 22, 24)** e sincronização entre dispositivos via API REST (`/api/preferencias/acessibilidade`) com persistência em banco e cache em `localStorage`.
  - **Encerramento de Conta**: Ação de cancelamento definitivo do cadastro com confirmação de segurança.

### 8. Central de Notificações
- **Modal Dropdown Flutuante no Header**:
  - Contador dinâmico de notificações não lidas em tempo real.
  - Ícone de lâmpada para sugestões de tarefas.
  - **Destaque Vermelho**: Alerta visual crítico para notificações de tarefas vencidas.
  - **Destaque Azul**: Alerta visual prioritário para tarefas com prioridade urgente.
  - Ações rápidas: marcar notificação individual como lida, marcar todas como lidas e limpar histórico completo.

---

## 🎨 Design System & Acessibilidade

O projeto implementa uma paleta de cores corporativa padronizada e responsiva a múltiplos modos visuais:

| Token / Papel | Código HEX (Claro) | Código HEX (Escuro) | Aplicação |
| :--- | :--- | :--- | :--- |
| **Primary (Roxo Principal)** | `#7B4FC9` | `#9B6EE9` | Ações principais, botões, bordas ativas e identidade de marca |
| **Secondary (Azul Escuro)** | `#12192C` | `#1A2238` | Sidebar, cabeçalhos de destaque e superfícies escuras |
| **Accent Verde (Sucesso)** | `#134011` / `#22C55E` | `#4ADE80` | Status Concluída, tags de aprovação e métricas positivas |
| **Accent Vermelho (Alerta)** | `#D63131` / `#EF4444` | `#F87171` | Status Atrasada, prioridade urgente e ações destrutivas |
| **Accent Laranja (Pendente)** | `#F59E0B` | `#FBBF24` | Status Pendente e alertas moderados |
| **Superfície / Fundo** | `#F8F9FA` / `#FFFFFF` | `#0F172A` / `#1E293B` | Background da aplicação e cards modulares |

### Diretrizes de Acessibilidade
- **Tipografia**: Família **Poppins** (`300`, `400`, `500`, `600`, `700`) com suporte a redimensionamento global entre 12px e 24px com opções exclusivamente pares (`12px`, `14px`, `16px`, `18px`, `20px`, `22px`, `24px`) via grade visual e slider de ajuste contínuo com step 2.
- **Alto Contraste**: Tema dedicado elevando contrastes de texto e contornos a ratios superiores a **7:1** (WCAG AAA).
- **Semântica HTML & ARIA**: Botões acessíveis, roles de navegação e eliminação de tags interativas aninhadas.
- **SSR Hydration Safe**: Prevenção ativa de flashes visuais e divergências entre renderização no servidor e cliente (`suppressHydrationWarning` em formatações de data e checagens seguras de storage).

---

## 📁 Estrutura do Projeto

```
Cortex-frontend/
├── public/                       # Assets estáticos, ícones e logotipo da aplicação
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Grupo de rotas públicas
│   │   │   ├── login/            # Tela de login (/login)
│   │   │   └── registro/         # Tela de cadastro (/registro)
│   │   ├── (dashboard)/          # Grupo de rotas protegidas (autenticadas)
│   │   │   ├── layout.tsx        # Layout unificado com Sidebar fixa e Header
│   │   │   ├── layout.module.css
│   │   │   ├── minhas-tarefas/   # Painel de tarefas do responsável
│   │   │   │   └── [id]/         # Detalhes, respostas e anexos da tarefa
│   │   │   ├── tarefas-atribuidas/# Painel de tarefas delegadas pelo criador
│   │   │   │   └── [id]/         # Auditoria de entregas, notas e moderação
│   │   │   ├── equipes/          # Gestão e listagem de equipes
│   │   │   │   └── [id]/         # Gestão de membros, cargos e tickets
│   │   │   ├── metas/            # Metas e progresso de gamificação
│   │   │   ├── relatorios/       # Relatórios, KPIs e exportação para PDF
│   │   │   └── configuracoes/    # Perfil, foto, senha, notificações e acessibilidade
│   │   ├── Components/           # Componentes estruturais do layout
│   │   │   ├── Header/           # Barra superior, perfil e central de notificações
│   │   │   └── Sidebar/          # Barra de navegação lateral com abas
│   │   ├── globals.css           # Tokens CSS, variáveis de tema e estilos base
│   │   ├── layout.tsx            # Root Layout com carregamento de fontes e providers
│   │   └── page.tsx              # Redirecionamento da raiz (/) para dashboard ou login
│   ├── components/               # Componentes reutilizáveis por domínio
│   │   ├── common/               # Componentes atômicos (Badge, Button, Input, Modal, Icons, etc.)
│   │   ├── goals/                # Modais e cartões de metas (GoalCreateModal)
│   │   ├── tasks/                # Modais de tarefas, anexos, tickets e sugestões
│   │   └── teams/                # Modais de criação de equipes e adição de membros
│   ├── contexts/                 # Contextos globais do React (Auth, Accessibility, Notification, Toast)
│   │   ├── AccessibilityContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/                 # Clientes HTTP e integração com a API do Cortex Backend
│   │   ├── api.ts                # Cliente fetch base com credenciais e tratamento ProblemDetails
│   │   ├── authService.ts
│   │   ├── equipeService.ts
│   │   ├── metaService.ts
│   │   ├── notificationService.ts# Endpoints REST de notificações no banco
│   │   ├── relatorioService.ts
│   │   ├── respostaService.ts    # Envio de respostas e atribuição de notas
│   │   ├── sugestaoService.ts
│   │   ├── tarefaService.ts      # CRUD de tarefas e cancelamento de conclusão
│   │   ├── ticketService.ts
│   │   └── usuarioService.ts     # Perfil, remoção de foto e encerramento de conta
│   └── types/                    # Tipagens TypeScript e contratos de API
│       └── api.ts
├── eslint.config.mjs             # Configuração do ESLint
├── next.config.ts                # Configurações do Next.js (imagens remotas e otimizações)
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json                 # Configuração do compilador TypeScript
```

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior (LTS recomendada).
- **Gerenciador de Pacotes**: `pnpm` (recomendado v9+ ou v11+), `npm` ou `yarn`.
- **Cortex Backend**: Instância da API ativa (padrão em `http://localhost:5000` ou `http://localhost:5220`).

### Passo a Passo

1. **Clonar o Repositório**:
```bash
git clone https://github.com/seu-usuario/cortex-frontend.git
cd cortex-frontend
```

2. **Instalar Dependências**:
```bash
pnpm install
# ou: npm install
```

3. **Configurar Variáveis de Ambiente**:
Crie um arquivo `.env.local` na raiz do projeto com base nas configurações da sua API:
```env
# URL base da API Cortex Backend
NEXT_PUBLIC_API_URL=http://localhost:5220
```

4. **Executar em Ambiente de Desenvolvimento**:
```bash
pnpm dev
# ou: npm run dev
```
Acesse a aplicação em seu navegador através de: [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Inicia o servidor local de desenvolvimento com hot-reloading em `http://localhost:3000`. |
| `pnpm build` | Gera a compilação de produção altamente otimizada do Next.js. |
| `pnpm start:prod` | Executa o servidor Node.js servindo o build de produção gerado. |
| `pnpm lint` | Executa o linter ESLint para validar boas práticas e padrões de código. |

---

## 🔗 Integração com a API Backend

O frontend comunica-se exclusivamente com a API RESTful do **Cortex Backend**:

- **Comunicação por Cookies & Headers**: Utiliza `credentials: 'include'` em todas as chamadas HTTP para trafegar o cookie de sessão seguro `cortex_token`, mantendo compatibilidade adicional com header `Authorization: Bearer <token>`.
- **Tratamento de Exceções**: A camada `apiFetch` intercepta respostas de erro no padrão **RFC 7807 (`ProblemDetails`)**, extraindo automaticamente mensagens amigáveis e disparando toasts informativos.
- **Suporte a Multipart Form Data**: Chamadas que realizam upload de anexos (respostas de tarefas, fotos de perfil ou anexos de criação) enviam instâncias de `FormData` sem sobrescrever manualmente o cabeçalho `Content-Type`, permitindo que o navegador defina o boundary correto.

---

## 📄 Licença

Este projeto é desenvolvido para fins corporativos e acadêmicos como parte do ecossistema de produtividade **Cortex**. Todos os direitos reservados.
