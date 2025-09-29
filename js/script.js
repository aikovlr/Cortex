function abrirTarefa(url) {
  window.location.href = url;
}

// tarefa.html

// Mock de dados (futuramente pode puxar via API)
const tarefas = [
  {
    id: 1,
    nome: "Criar protótipo",
    vencimento: "12 de junho de 2025 às 23:59",
    instrucoes: "Criar o protótipo da aplicação e validar com a equipe.",
    responsavel: "Kayke",
    status: "Pendente"
  },
  {
    id: 2,
    nome: "Entregar projeto",
    vencimento: "12 de junho de 2025 às 23:59",
    instrucoes: "Entregar o projeto finalizado ao cliente.",
    responsavel: "Kayke",
    status: "Entrega"
  }
];

// Função para abrir tarefa pela tabela
function abrirTarefa(id) {
  window.location.href = `tarefa.html?id=${id}`;
}

// Função para carregar detalhes no tarefa.html
function carregarTarefa() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  const tarefa = tarefas.find(t => t.id === id);

  if (tarefa) {
    document.getElementById("taskName").textContent = tarefa.nome;
    document.getElementById("taskDue").textContent = `Vence ${tarefa.vencimento}`;
    document.getElementById("taskInstructions").textContent = tarefa.instrucoes;
  } else {
    document.getElementById("taskName").textContent = "Tarefa não encontrada";
  }
}

// Executa apenas na página tarefa.html
if (window.location.pathname.includes("tarefa.html")) {
  carregarTarefa();
}
