# Cortex - Aplicação de Gerenciamento de Tarefas

Uma aplicação web moderna de gerenciamento de tarefas projetada para colaboração em equipe e produtividade. Cortex permite aos usuários criar, gerenciar e acompanhar tarefas com uma interface intuitiva e suporte a temas claro/escuro.

## 🎯 Recursos

- **Gerenciamento de Tarefas**: Criar, visualizar e gerenciar tarefas com informações detalhadas
- **Colaboração em Equipe**: Visualizar membros da equipe e atribuições de tarefas
- **Autenticação de Usuário**: Sistema de login seguro com autenticação baseada em token
- **Modo Claro/Escuro**: Alterne entre temas claro e escuro com preferências persistentes
- **Detalhes da Tarefa**: Cada tarefa inclui:
  - Título e descrição
  - Datas de vencimento com contagem regressiva
  - Níveis de prioridade (Baixa, Média, Alta, Urgente)
  - Sistema de pontuação
  - Anexos de arquivo
  - Rastreamento de status
- **Sistema de Feedback**: Enviar feedback, relatórios e sugestões para tarefas

## 📁 Estrutura do Projeto

```
Cortex/
├── index.html              # Página principal do painel
├── css/
│   ├── globalstyles.css   # Folha de estilos global
│   ├── index.css          # Estilos do painel
│   ├── login.css          # Estilos da página de login
│   ├── cadastro.css       # Estilos da página de registro
│   ├── equipe.css         # Estilos da página de equipe
│   └── tarefas.css        # Estilos da página de detalhes da tarefa
├── js/
│   ├── globaljs.js        # JavaScript global (alternância de tema)
│   ├── auth.js            # Autenticação e autorização
│   ├── index.js           # Lógica do painel
│   ├── login.js           # Lógica da página de login
│   ├── cadastro.js        # Lógica de registro
│   ├── equipe.js          # Lógica da página de equipe
│   └── tarefa.js          # Lógica da página de detalhes da tarefa
├── pages/
│   ├── login.html         # Página de login
│   ├── cadastro.html      # Página de registro
│   ├── tarefa.html        # Página de detalhes da tarefa
│   └── equipe.html        # Página de equipe
├── images/                # Imagens e ativos da aplicação
└── README.md              # Este arquivo
```

## 🚀 Começando

### Pré-requisitos

- Um navegador web moderno (Chrome, Firefox, Safari, Edge)
- Nenhuma instalação no lado do servidor necessária - esta é uma aplicação frontend

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/aikovlr/Cortex.git
   cd Cortex
   ```

2. **Abra a aplicação**
   
   **Opção 1: Acesso Direto ao Arquivo**
   - Simplesmente clique duas vezes em `index.html` na pasta do projeto
   - Ou abra em seu navegador: `file:///caminho/para/Cortex/index.html`

   **Opção 2: Usando um Servidor Local (Recomendado)**
   - Com Python 3:
     ```bash
     python -m http.server 8000
     ```
   - Com Node.js (se instalado):
     ```bash
     npx http-server
     ```
   - Depois navegue para `http://localhost:8000` ou `http://localhost:8080` em seu navegador

3. **Configuração Inicial**
   - Você será redirecionado para a página de login (`pages/login.html`)
   - Crie uma nova conta ou faça login com credenciais existentes
   - Seu token de autenticação e dados de usuário serão armazenados no `localStorage` do navegador

## 📖 Uso

### Autenticação
- A aplicação usa autenticação baseada em token armazenada em `localStorage`
- Os usuários devem fazer login para acessar o painel e outros recursos
- Usuários não autorizados são automaticamente redirecionados para a página de login

### Painel (index.html)
- Visualize todas as suas tarefas atribuídas
- Procure tarefas usando a barra de pesquisa
- Clique no botão **+** para criar uma nova tarefa
- Clique em qualquer linha de tarefa para visualizar os detalhes da tarefa

### Criando uma Tarefa
- Clique no botão **+** no painel
- Preencha os detalhes da tarefa:
  - **Nome da tarefa** (Nome da tarefa)
  - **Descrição** (Descrição)
  - **Data de entrega** (Data de vencimento)
  - **Prioridade** (Prioridade: Baixa/Média/Alta/Urgente)
  - **Pontuação** (Pontos)
  - **Atribuir a** (Atribuir ao email do membro da equipe)
  - **Anexar arquivo** (Anexo de arquivo opcional)

### Página de Detalhes da Tarefa (tarefa.html)
- Visualize informações completas da tarefa
- Marque a tarefa como concluída com o botão **Finalizar tarefa**
- Forneça feedback ao concluir uma tarefa
- Reporte problemas usando o botão **Reportar tarefa**
- Sugira melhorias com o botão **Sugerir alteração**

### Página de Equipe (equipe.html)
- Visualize todos os membros da equipe
- Veja informações dos membros da equipe e atribuições

### Alternância de Tema
- Use a opção de alternância na barra lateral para alternar entre temas claro e escuro
- Sua preferência é salva automaticamente

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Armazenamento**: Browser `localStorage` para dados de usuário e preferências
- **Design**: CSS responsivo com princípios modernos de UI/UX
- **Internacionalização**: Interface em idioma português (pt-BR)

## 💾 Armazenamento Local

A aplicação usa `localStorage` para persistir:
- `token` - Token de autenticação
- `userName` - Nome do usuário conectado
- `userData` - Informações do perfil do usuário
- `tema` - Preferência de tema (claro/escuro)

## 🌙 Modo Claro/Escuro

A aplicação inclui um seletor de tema integrado:
- Alterne a opção na barra lateral para alterar temas
- O tema escuro usa cinzas profundos e roxos
- O tema claro usa brancos suaves e roxos claros
- Sua preferência persiste em todas as sessões

## 🔐 Notas de Segurança

⚠️ **Importante**: Esta é uma aplicação apenas frontend. Para uso em produção, certifique-se de:
- Implementar uma API backend segura para autenticação
- Usar HTTPS para todas as comunicações
- Nunca armazenar informações sensíveis em `localStorage`
- Implementar proteção adequada contra CSRF
- Validar e sanitizar todas as entradas do usuário no lado do servidor

## 📝 Visão Geral das Páginas

| Página | URL | Propósito |
|--------|-----|----------|
| Painel | `index.html` | Visualizar e gerenciar tarefas |
| Login | `pages/login.html` | Autenticação do usuário |
| Registro | `pages/cadastro.html` | Criar nova conta de usuário |
| Detalhes da Tarefa | `pages/tarefa.html` | Visualizar tarefa específica e fornecer feedback |
| Equipe | `pages/equipe.html` | Visualizar membros da equipe |

## 🐛 Resolução de Problemas

### Erro "Not found" ao carregar a página
- Certifique-se de que você está usando um servidor local em vez de abrir arquivos diretamente
- Problemas de CORS podem ocorrer ao abrir arquivos diretamente com protocolo `file://`

### Tarefas não carregando
- Verifique se o `localStorage` está ativado no seu navegador
- Limpe o cache do navegador e atualize
- Certifique-se de que você está conectado (o token deve estar presente em localStorage)

### Tema não persistindo
- Verifique se o `localStorage` está ativado
- Limpe o cache do navegador
- Redefina manualmente nas Ferramentas do Desenvolvedor: `localStorage.setItem('tema', 'claro')`

## 👥 Contribuindo

1. Faça um fork do repositório
2. Crie um branch de recurso (`git checkout -b feature/RecursoAmeaçador`)
3. Faça commit das suas alterações (`git commit -m 'Adicionar RecursoAmeaçador'`)
4. Envie para o branch (`git push origin feature/RecursoAmeaçador`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para detalhes.

## 📧 Contato

Para dúvidas ou suporte, entre em contato com os mantenedores do projeto ou abra um problema no GitHub.

---

**Feliz gerenciamento de tarefas! 🎯**
