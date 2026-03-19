// carrega as tarefas ao abrir a página
window.onload = function () {
  listarTarefas();
}

function toggleForm() {
  const formCard = document.getElementById("formCard");

  if (formCard.open) {
    formCard.close();
    return;
  }
  formCard.showModal();
  carregarEquipes();
}

function radioCheck() {
  const radios = document.querySelectorAll('input[name="tipo_atribuicao"]');
  const campoEquipe = document.getElementById("equipe");
  const campoEmail = document.getElementById("email_responsavel");

  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        campoEquipe.style.display = radio.value === "equipe" ? "block" : "none";
        campoEmail.style.display = radio.value === "individual" ? "block" : "none";
      }
    });
  });
}

radioCheck();

function formatarData(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// injeta as tarefas na tabela na formatação correta
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
        <td>${tarefa.prioridade}</td>
      `;

    tbody.appendChild(tr);
  })
};

// lista as tarefas
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
  const mensagemErro = document.getElementById("mensagemErro");

  const tipo = dados.get("tipo_atribuicao");

  const dataForms = {
   titulo: dados.get("titulo"),
   descricao: dados.get("descricao"),
   dt_vencimento: dados.get("dataEntrega"),
   pontuacao: dados.get("pontuacao"),
   prioridade: dados.get("prioridade"),
   tipo_atribuicao: tipo
  };

  if (tipo === "equipe") {
    dataForms.id_equipe_fk = dados.get("equipe");
  }

  if (tipo === "individual") {
    dataForms.email_responsavel = dados.get("email_responsavel");
  }


  // Envia os dados para o servidor/db
  try {
    const resposta = await fetch('http://localhost:3000/tarefa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(dataForms)
    });

    if (!resposta.ok) {
      throw new Error('Erro na resposta do servidor');
    }

    listarTarefas();
  } catch (error) {
    mensagemErro.textContent = "Erro ao criar tarefa. Verifique os campos preenchidos ou tente novamente mais tarde.";
    return;
  }

  const popup = document.getElementById("popupSucesso");
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    window.location.href = "../index.html";
  }, 2000);
});

async function carregarEquipes() {
  const resposta = await fetch('http://localhost:3000/equipe', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`
    }
  });

  const equipes = await resposta.json();
  const dropdown = document.getElementById("equipe");

  equipes.forEach(equipe => {
    const option = document.createElement("option");
    option.value = equipe.id_equipe;
    option.textContent = equipe.nome;
   dropdown.appendChild(option);
  });

}

