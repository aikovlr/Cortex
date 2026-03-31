function toggleForm() {
  const formCard = document.getElementById("formCard");

  if (formCard.open) {
    formCard.close();
    return;
  }
  formCard.showModal();
}

// injeta as equipes na tabela na formatação correta
async function listarEquipes() {
  try {
    const resposta = await fetch(`${API_BASE}/equipe`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resposta.ok) {
      throw new Error("Erro ao listar equipes. Tente novamente mais tarde.");
    }

    const equipes = await resposta.json();
    injetarEquipes(equipes);
    console.log("equipes", equipes)

  } catch (error) {
    console.error("Erro ao listar equipes. Tente novamente mais tarde.", error);
  }
}

// Chama a função para listar as equipes ao carregar a página
window.onload = function () {
  listarEquipes();
}

function injetarEquipes(equipes) {
  const container = document.getElementById("equipes-container");
  container.innerHTML = "";

  equipes.forEach(equipe => {
    const cardLink = document.createElement("a");
    cardLink.href = `../pages/detalhesEquipe.html?id=${equipe.id_equipe}`;
    cardLink.className = "team-card-link";

    const card = document.createElement("div");
    card.className = "team-card";

    card.innerHTML = `
      <h3>${equipe.nome}</h3>
      <p>${equipe.descricao || 'Sem descrição'}</p>
    `;

    cardLink.appendChild(card);
    container.appendChild(cardLink);
  });
}


// Evento de submit para criar equipe
document.getElementById("formCard").addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = new FormData(e.target);

  const nome = dados.get("nome");
  const descricao = dados.get("descricao");

  try {
    const resposta = await fetch(`${API_BASE}/equipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ nome, descricao })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao criar equipe. Tente novamente mais tarde.");
    }

  } catch (error) {
    console.error("Erro ao criar equipe. Tente novamente mais tarde.", error);
    const popupErro = document.getElementById("popupErro");
    popupErro.textContent = "Erro ao criar equipe.";
    popupErro.classList.add("show");
    setTimeout(() => popupErro.classList.remove("show"), 3000);
    return;
  }

  console.log("TOKEN:", localStorage.getItem("token"));
  const popup = document.getElementById("popupSucesso");
  popup.textContent = "Equipe criada com sucesso!";
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    window.location.href = "../pages/equipe.html";
  }, 2000);
});

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

  try {
    const resposta = await fetch(`${API_BASE}/equipe?search=${encodeURIComponent(value)}`, {
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
    const equipes = await resposta.json();
    injetarEquipes(equipes);
  }
  catch (error) {
    console.error("Erro ao buscar equipes. Tente novamente mais tarde.", error);
  }
}

const debouncedSearch = debounce(performSearch, 500);

// search de equipes
document.getElementById("search-input").addEventListener("input", async function (e) {
  const query = e.target.value.toLowerCase();

  debouncedSearch(query);
});
