# 🎨 Cortex Front-End — Interface Web Corporativa

Aplicação web moderna, intuitiva e acessível para gerenciamento transacional de tarefas, equipes, metas, gamificação corporativa e colaboração empresarial. Desenvolvida em **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **CSS Modules**, totalmente integrada aos contratos REST da API **Cortex Backend** e projetada em estrita conformidade com as diretrizes de acessibilidade **WCAG 2.1 AA / AAA** e o **Design System** institucional.

---

## 📑 Sumário

1. [Visão Geral & Tecnologias](#-visão-geral--tecnologias)
2. [Estrutura do Projeto](#-estrutura-do-projeto)
3. [Módulos & Funcionalidades](#-módulos--funcionalidades)
   - [Landing Page Institucional](#1-landing-page-institucional)
   - [Autenticação, Recuperação & LGPD](#2-autenticação-recuperação--lgpd)
   - [Minhas Tarefas & Respostas](#3-minhas-tarefas--respostas)
   - [Tarefas Atribuídas & Avaliação](#4-tarefas-atribuídas--avaliação)
   - [Gestão de Equipes & Governança](#5-gestão-de-equipes--governança)
   - [Metas & Gamificação (XP e Níveis)](#6-metas--gamificação-xp-e-níveis)
   - [Central de Relatórios & Exportação PDF](#7-central-de-relatórios--exportação-pdf)
   - [Configurações, Perfil & Acessibilidade](#8-configurações-perfil--acessibilidade)
   - [Central de Notificações](#9-central-de-notificações)
4. [Design System & Acessibilidade](#-design-system--acessibilidade)
5. [Segurança no Front-End & Integração](#-segurança-no-front-end--integração)
6. [Instalação & Execução Local](#-instalação--execução-local)
7. [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🚀 Visão Geral & Tecnologias

- **Framework**: Next.js 16 (App Router com layouts aninhados e Server/Client Components)
- **Biblioteca Base**: React 19 com React Compiler
- **Linguagem**: TypeScript 5.x com tipagem estrita de contratos de API e DTOs
- **Estilização**: CSS Modules com tokens de design em CSS nativo (zero runtime de CSS-in-JS)
- **Animações**: MagicUI (efeitos modernos de revelação de texto, scroll progress e blur-fade suaves)
- **Formatação & Editor**: MarkdownEditor e MarkdownRenderer com suporte a formatação avançada
- **Gerenciador de Estado**: React Context API desacoplado em provedores especialistas:
  - `AuthContext`: Estado de sessão, usuário logado e ciclo de vida de autenticação.
  - `AccessibilityContext`: Tema (`light`, `dark`), alto contraste, escalonamento tipográfico e sincronização em nuvem.
  - `NotificationContext`: Central de notificações com persistência em banco e badges reativos.
  - `ToastContext`: Notificações visuais e alertas transitórios acessíveis.
  - `SidebarContext`: Controle responsivo de expansão e recolhimento da barra lateral.

---

## 📁 Estrutura do Projeto

```
Cortex-frontend/
├── public/                       # Assets estáticos, ícones e logotipo institucional
├── src/
│   ├── app/                      # Rotas e páginas do Next.js App Router
│   │   ├── (dashboard)/          # Rotas autenticadas sob layout unificado
│   │   │   ├── configuracoes/    # Perfil, acessibilidade, senha e notificações
│   │   │   ├── equipes/          # Gestão de equipes, membros e tickets
│   │   │   ├── metas/            # Metas, progresso e objetivos corporativos
│   │   │   ├── minhas-tarefas/   # Tarefas sob responsabilidade do usuário
│   │   │   ├── relatorios/       # KPIs, gráficos e exportação PDF
│   │   │   └── tarefas-atribuidas# Painel do gestor/criador de tarefas
│   │   ├── Components/           # Header global e Sidebar fixa com controle ativo
│   │   ├── esqueci-senha/        # Fluxo de solicitação de redefinição de senha
│   │   ├── login/                # Tela de login com validações
│   │   ├── redefinir-senha/      # Validação de código e troca segura de senha
│   │   ├── registro/             # Cadastro com validação de força e LGPD
│   │   └── page.tsx              # Landing page interativa institucional
│   ├── components/               # Componentes reutilizáveis divididos por domínio
│   │   ├── common/               # Componentes atômicos (Badge, Button, Input, Modal, Combobox, etc.)
│   │   ├── gamification/         # Widgets de nível, avatar com XP e modal comemorativo
│   │   ├── goals/                # Modais de criação e edição de metas
│   │   ├── landing/              # Seções componentes da landing page (Hero, About, etc.)
│   │   ├── magicui/              # Utilitários visuais de animação moderna
│   │   ├── tasks/                # Modais de tarefas, galeria de anexos e sugestões
│   │   └── teams/                # Modais de equipes e convite de membros
│   ├── contexts/                 # Contextos globais do React
│   ├── services/                 # Camada de serviços HTTP integrada à API Backend
│   ├── types/                    # Tipagens TypeScript e interfaces de DTOs
│   └── utils/                    # Funções utilitárias (gamificação, máscaras e validações)
├── eslint.config.mjs             # Regras de linting de código
├── next.config.ts                # Otimizações de compilação do Next.js
└── package.json
```

---

## 🧩 Módulos & Funcionalidades

### 1. Landing Page Institucional (`/`)
* Apresentação comercial de alta conversão com animações dinâmicas de rolagem (MagicUI).
* Seções dedicadas: *Hero*, *Sobre o Cortex*, *Público-Alvo*, *Recursos Chave*, *Gamificação*, *Acessibilidade Inclusiva* e *Chamada para Ação (CTA)*.
* Totalmente responsiva para smartphones, tablets e desktops.

### 2. Autenticação, Recuperação & LGPD
* **Login (`/login`)**: Autenticação com validação estrita, proteção contra força bruta e armazenamento do cookie `cortex_token` (`HttpOnly; Secure`).
* **Registro (`/registro`)**: Cadastro com checklist dinâmico de critérios de segurança da senha (RN002) e consentimento explícito aos Termos de Uso e Política de Privacidade (LGPD).
* **Esqueci Minha Senha (`/esqueci-senha`)**: Envio assíncrono de código de verificação para a caixa de e-mail cadastrada.
* **Redefinição de Senha (`/redefinir-senha`)**: Validação em tempo real de critérios de senha e confirmação com código de 6 dígitos.

### 3. Minhas Tarefas & Respostas (`/minhas-tarefas`)
* Listagem analítica das tarefas sob responsabilidade do colaborador logado.
* Filtros interativos por status (`Pendente`, `Atrasada`, `Concluída`) e níveis de prioridade.
* **Detalhes da Tarefa (`/minhas-tarefas/[id]`)**:
  - Visualização de orientações formatadas em Markdown com prazos e pontuação.
  - **Entrega de Resposta**: Submissão de relatório de execução acompanhado de múltiplos anexos.
  - **Galeria de Anexos**: Visualizador integrado com suporte a imagens, documentos PDF e planilhas.
  - **Sugestões de Alteração (RN14)**: Canal para sugerir ajustes de prazo ou escopo ao criador.
  - **Tickets de Reporte (RF008)**: Abertura de chamados de dúvida ou impedimento técnico.
  - **Conclusão e Reversão**: Botão de conclusão com um clique e opção de reversão caso necessários novos ajustes.

### 4. Tarefas Atribuídas & Avaliação (`/tarefas-atribuidas`)
* Painel de controle para gestores e criadores de tarefas.
* **Criação Ágil de Tarefas**: Modal completo com upload de arquivos de instrução, vinculação a equipes e atribuição a múltiplos responsáveis.
* **Auditoria de Respostas**: Visualização e download das entregas realizadas pelos colaboradores.
* **Avaliação com Notas**: Atribuição de nota quantitativa respeitando o teto de pontuação da tarefa.
* **Moderação de Sugestões**: Aprovação (com atualização automática da tarefa) ou reprovação justificada de sugestões de colaboradores.

### 5. Gestão de Equipes & Governança (`/equipes`)
* Painel com as equipes em que o usuário atua com identificação visual do seu cargo (`Dono`, `Admin` ou `Membro`).
* **Criação de Equipes**: Cadastro dinâmico de novas equipes pelo usuário.
* **Administração de Membros (`/equipes/[id]`)**:
  - Adição de colaboradores por e-mail com busca assistida.
  - Alteração hierárquica de papéis (`Admin` e `Membro`) com controle exclusivo para o Dono.
  - Remoção de membros com confirmação de segurança.
  - Painel de tickets abertos vinculados às tarefas do time.

### 6. Metas & Gamificação (XP e Níveis) (`/metas`)
* **Acompanhamento de Objetivos**: Agrupamento de metas corporativas e individuais com barra de progresso calculada automaticamente em tempo real.
* **Sistema de Gamificação**:
  - Usuários ganham experiência (XP) ao concluir tarefas e metas dentro do prazo.
  - Avatares exibem insígnias dinâmicas com o nível do usuário (`UserLevelAvatar`).
  - Modal comemorativo (`XpCelebrationModal`) disparado ao subir de nível.
* **Priorização Inteligente**: Ordenação automática de metas críticas (`Atrasada` > `Pendente` > `Concluída`).

### 7. Central de Relatórios & Exportação PDF (`/relatorios`)
* Painel de Business Intelligence (BI) para acompanhamento da produtividade corporativa.
* Filtros combinados por Equipe, Responsável, Criador, Status, Prioridade e Janela Temporal.
* Cartões de KPIs consolidados (taxa de conclusão percentual, tarefas concluídas, pendências e atrasos).
* Gráficos comparativos de distribuição renderizados em CSS de alta performance.
* **Exportação para PDF**: Geração de relatório executivo paginado e pronto para impressão ou compartilhamento formal.

### 8. Configurações, Perfil & Acessibilidade (`/configuracoes`)
* **Minha Conta**: Edição de dados cadastrais, upload e remoção imediata de foto de perfil.
* **Segurança**: Alteração de senha exigindo validação de senha atual.
* **Preferências de Notificação**: Seleção granular de canais (`Email`, `Push`, `SMS`) e antecedência para avisos de prazo.
* **Acessibilidade Universal**:
  - Alternância imediata entre tema Claro e Escuro.
  - Modo de **Alto Contraste** (WCAG AAA).
  - Escala tipográfica entre **12px e 24px com opções exclusivamente pares** (12, 14, 16, 18, 20, 22, 24).
  - Sincronização multi-dispositivo automática em nuvem e persistência local.
* **Exclusão de Conta**: Encerramento definitivo do cadastro com confirmação contra erros acidentais.

### 9. Central de Notificações
* Menu flutuante no cabeçalho com contagem em tempo real de mensagens não lidas.
* Destaques visuais por criticidade: vermelho para tarefas atrasadas, azul para tarefas urgentes e ícone de lâmpada para sugestões.
* Ações em lote para marcar como lidas ou limpar notificações.

---

## 🎨 Design System & Acessibilidade

O projeto segue rigorosamente a identidade visual institucional e especificações de acessibilidade **WCAG 2.1**:

| Token de Cores | Modo Claro | Modo Escuro | Finalidade |
| :--- | :--- | :--- | :--- |
| **Primary (Roxo Principal)** | `#7B4FC9` | `#9B6EE9` | Ações principais, destaques ativos e identidade |
| **Secondary (Azul Escuro)** | `#12192C` | `#1A2238` | Sidebar, cabeçalhos e superfícies nobres |
| **Success (Verde)** | `#22C55E` | `#4ADE80` | Conclusões, aprovações e progresso positivo |
| **Danger (Vermelho)** | `#EF4444` | `#F87171` | Alertas críticos, atrasos e ações destrutivas |
| **Warning (Laranja)** | `#F59E0B` | `#FBBF24` | Status pendente e avisos de atenção |
| **Background / Cards** | `#F8F9FA` / `#FFFFFF` | `#0F172A` / `#1E293B` | Superfícies de leitura e contraste |

### Requisitos de Acessibilidade
- **Navegação Completa por Teclado**: Foco visível em todos os elementos interativos e links de salto (*skip links*).
- **Leitores de Tela (a11y)**: Rótulos semânticos (`aria-label`, `aria-live="polite"`, `aria-expanded`).
- **Respeito a Preferências do Sistema**: Suporte à diretiva CSS `prefers-reduced-motion` para desativar animações em usuários com sensibilidade visual.

---

## 🛡 Segurança no Front-End & Integração

1. **Gestão de Sessão Baseada em Cookie Seguro**:
   - A aplicação utiliza `credentials: 'include'` no cliente HTTP (`api.ts`). O token JWT é manipulado prioritariamente em cookie seguro pelo navegador, mitigando roubo de credenciais via XSS.
2. **Prevenção de Injeção de Conteúdo**:
   - Respostas e dados do usuário são sanitizados antes de renderização, mesmo em blocos Markdown.
3. **Resiliência a Erros**:
   - Interceptação automática de códigos **HTTP 401** e **403** com redirecionamento controlado para login sem loops de navegação.
   - Tratamento universal de erros estruturados no padrão **RFC 9457 / RFC 7807 (`ProblemDetails`)**, extraindo detalhes amigáveis para o usuário.

---

## ⚙️ Instalação & Execução Local

### Pré-requisitos
- **Node.js**: Versão 20.x ou superior (LTS)
- **pnpm**: Versão 9+ ou 11+ (ou `npm` / `yarn`)
- **Cortex Backend**: API rodando em `http://localhost:5220` (ou porta configurada)

### 1. Clonar e Instalar
```bash
git clone https://github.com/aikovlr/Cortex-frontend.git
cd Cortex-frontend

pnpm install
```

### 2. Configurar Variáveis de Ambiente
Crie o arquivo `.env.local` na raiz do projeto:

```env
# URL base da API Cortex Backend
NEXT_PUBLIC_API_URL=http://localhost:5220
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
pnpm dev
```
Acesse a aplicação no navegador em: **[http://localhost:3000](http://localhost:3000)**.

---

## 📜 Scripts Disponíveis

| Script | Finalidade |
| :--- | :--- |
| `pnpm dev` | Inicia o servidor local de desenvolvimento com hot-reloading |
| `pnpm build` | Gera a compilação de produção otimizada do Next.js |
| `pnpm start` | Inicia o servidor Node.js servindo o build de produção compilado |
| `pnpm lint` | Executa o ESLint para auditoria estática de código |

---

## 📄 Licença
Desenvolvido para fins corporativos e acadêmicos como parte do ecossistema **Cortex**. Todos os direitos reservados.
