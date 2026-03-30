window.onload = function () {
  listarTarefasAtribuidas();
}

function formatarData(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function injetarTarefasAtribuidas(tarefas) {
  const tbody = document.getElementById("tarefas-atribuidas-body");
  tbody.innerHTML = "";

  tarefas.forEach(tarefa => {
    const tr = document.createElement("tr");
    const href = `tarefa.html?id=${tarefa.id_tarefa}`;
    const editHref = `editar-tarefa.html?id=${tarefa.id_tarefa}`;
    tr.classList.add("row-link");
    tr.innerHTML = `
            <td>${tarefa.titulo}</td>
            <td>${formatarData(tarefa.dt_vencimento)}</td>
            <td>${tarefa.responsavel}</td>
            <td><button type="button" class="detail-btn">Editar</button></td>
        `;
    tr.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      window.location.href = href;
    });
    // Adicionar evento ao botão Editar
    const editBtn = tr.querySelector(".detail-btn");
    editBtn.addEventListener("click", () => {
      window.location.href = editHref;
    });
    tbody.appendChild(tr);
  });
}

async function listarTarefasAtribuidas() {
  try {
    const resposta = await fetch('http://localhost:3000/tarefas?tipo_tarefa=criada', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error("Erro real:", erro);
      return;
    }

    const tarefas = await resposta.json();
    injetarTarefasAtribuidas(tarefas);
    console.log("tarefas atribuídas", tarefas);
  } catch (error) {
    console.error("Erro ao buscar tarefas atribuídas. Tente novamente mais tarde.", error);
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
    const resposta = await fetch(`http://localhost:3000/tarefas?tipo_tarefa=criada&search=${encodeURIComponent(value)}`, {
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
    injetarTarefasAtribuidas(tarefas);
  }
  catch (error) {
    console.error("Erro ao buscar tarefas. Tente novamente mais tarde.", error);
  }
}

const debouncedSearch = debounce(performSearch, 500);

const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", function (e) {
    const query = e.target.value.toLowerCase();
    if (query === "") {
      listarTarefasAtribuidas();
      return;
    }
    debouncedSearch(query);
  });
}