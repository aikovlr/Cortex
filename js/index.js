// abre e fecha o formulário de nova tarefa
function toggleForm() {
  const formCard = document.getElementById("formCard");

  if (formCard.open) {
    formCard.close();
    return;
  }

  formCard.showModal();
}

function formatarData(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function injetarTarefa(tarefas) {
  const tbody = document.getElementById("tarefas-body");
  tbody.innerHTML = "";

  tarefas.forEach(tarefa => {
    const tr = document.createElement("tr");

    let classeStatus = "";

    switch (tarefa.status) {
      case "Pendente":
        classeStatus = "status pendente";
        break;
      case "Concluida":
        classeStatus = "status entrega";
        break;
      case "Atrasada":
        classeStatus = "status atrasada";
        break;
      default:
        classeStatus = "status atrasada";
    }

    tr.innerHTML = `
        <td><a href="../pages/tarefa.html?id=${tarefa.id_tarefa}">
        ${tarefa.titulo}
        </a></td>
        <td>${formatarData(tarefa.dt_vencimento)}</td>
        <td><span class="${classeStatus}">${tarefa.status}</span></td>
      `;

    tbody.appendChild(tr);
  })
};

// lista as tarefas e coloca na formatação do HTML
async function listarTarefas() {
      try {
        const resposta = await fetch('http://localhost:3000/tarefas', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!resposta.ok) {
          console.error("Erro ao buscar tarefas. Tente novamente mais tarde.");
          return;
        }

        const tarefas = await resposta.json();
        injetarTarefa(tarefas);
        console.log("tarefas", tarefas)

      } catch (error) {
        console.error("Erro ao buscar tarefas. Tente novamente mais tarde.", error);
      }
    }

// carrega as tarefas ao abrir a página
window.onload = function () {
      listarTarefas();
    }

// debounce para otimizar o search
function debounce(func, delay) {
      let timeoutId;
      return function (...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(context, args);
        }, delay);
      };
    }

async function performSearch(value) {
      console.log('Buscando por:', value);

      try {
        const resposta = await fetch(`http://localhost:3000/tarefas?search=${encodeURIComponent(value)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!resposta.ok) {
          console.error("Erro ao buscar tarefas. Tente novamente mais tarde.");
          return;
        }
        const tarefas = await resposta.json();
        injetarTarefa(tarefas);
      }
      catch (error) {
        console.error("Erro ao buscar tarefas. Tente novamente mais tarde.", error);
      }
    }

const debouncedSearch = debounce(performSearch, 500);


  // search de tarefas
  document.getElementById("search-input").addEventListener("input", async function (e) {
    const query = e.target.value.toLowerCase();

    debouncedSearch(query);
  });

  // cria nova tarefa e envia pro DB
  document.getElementById("formCard").addEventListener("submit", async function (e) {
    e.preventDefault();

    const dados = new FormData(e.target);

    const titulo = dados.get("titulo")
    const descricao = dados.get("descricao")
    const dt_vencimento = dados.get("dataEntrega")
    const pontuacao = dados.get("pontuacao")
    const email_responsavel = dados.get("email_responsavel")
    const prioridade = dados.get("prioridade")

    // Envia os dados para o servidor/db
    try {
      const resposta = await fetch('http://localhost:3000/tarefa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ titulo, descricao, dt_vencimento, pontuacao, prioridade, email_responsavel })
      });

      if (!resposta.ok) {
        throw new Error('Erro na resposta do servidor');
      }

      listarTarefas();
    } catch (error) {
      console.error("Erro ao criar tarefa. Tente novamente mais tarde.");
      return;
    }

    const popup = document.getElementById("popupSucesso");
    popup.classList.add("show");

    setTimeout(() => {
      popup.classList.remove("show");
      window.location.href = "/index.html";
    }, 2000);
  });

  const fileInput = document.getElementById("fileInput");
  const fileButton = document.getElementById("customFileButton");
  const fileName = document.getElementById("fileName");

  fileButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files.length
      ? fileInput.files[0].name
      : " ";


  });

  function abrirTarefa(url) {
    window.location.href = url;
  }