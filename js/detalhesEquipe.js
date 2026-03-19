// Função para adicionar um novo membro à equipe
document.getElementById("formCard").addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = new FormData(e.target);

  const email = dados.get("email");
  const isAdmin = dados.get("isAdmin") === "on";
  const params = new URLSearchParams(window.location.search);
  const id_equipe_fk = Number(params.get("id"));
  const mesangemErro = document.getElementById("mensagemErro");

  console.log("Email:", email);
  console.log("isAdmin:", isAdmin);
  console.log("id_equipe_fk:", id_equipe_fk);

  try {
    const resposta = await fetch('http://localhost:3000/membro_equipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ email, isAdmin, id_equipe_fk })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao adicionar membro à equipe. Tente novamente mais tarde.");
    }

    const popup = document.getElementById("popupSucesso");
    popup.classList.add("show");
    setTimeout(() => {
      popup.classList.remove("show");
    }, 2000);

  } catch (error) {
    mesangemErro.textContent = "Erro ao adicionar membro à equipe. Tente novamente mais tarde.";
    return;
  }

});

// Listar membros da equipe na tabela
async function listarMembros() {
  
  const id = new URLSearchParams(window.location.search).get("id");

  try {
    const resposta = await fetch(`http://localhost:3000/membro_equipe?id_equipe=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resposta.ok) {
      console.error("Erro ao buscar membros da equipe. Tente novamente mais tarde.");
      return;
    }

    const membros = await resposta.json();
    injetarMembros(membros);
    console.log("membros:", membros);

  } catch (error) {
    console.error("Erro ao buscar membros da equipe. Tente novamente mais tarde.", error);
  }
}

// Injetar membros na tabela
function injetarMembros(membros) {
  const tbody = document.getElementById("membros-body");
  tbody.innerHTML = ""; // Limpa o conteúdo anterior


  membros.forEach(membro => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${membro.nome}</td>
      <td>${new Date(membro.dt_entrada).toLocaleDateString()}</td>
      <td>${membro.tarefas_atribuidas}</td>
      <td>${membro.cargo}</td>
    `;
    tbody.appendChild(tr);
  });
};

window.onload = function () {
  listarMembros();
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

  const idEquipe = new URLSearchParams(window.location.search).get("id");

  try {
    const resposta = await fetch(`http://localhost:3000/membro_equipe?id_equipe=${idEquipe}&search=${value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resposta.ok) {
      console.error("Erro ao buscar membros. Tente novamente mais tarde.");
      return;
    }
    const membros = await resposta.json();
    injetarMembros(membros);
  }
  catch (error) {
    console.error("Erro ao buscar membros. Tente novamente mais tarde.", error);
  }
}

const debouncedSearch = debounce(performSearch, 500);

// search de equipes
document.getElementById("search-input").addEventListener("input", async function (e) {
  const query = e.target.value.toLowerCase();

  debouncedSearch(query);
});
