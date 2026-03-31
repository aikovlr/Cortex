let usuarioLogado = null;
let eventListenersAdded = false;

function toggleForm() {
  const formCard = document.getElementById("formCard");

  if (formCard.open) {
    formCard.close();
    return;
  }
  formCard.showModal();
}

async function buscarUsuarioLogado() {
  const idEquipe = new URLSearchParams(window.location.search).get("id");

  try {
    const res = await fetch(`${API_BASE}/membro_equipe/me?id_equipe=${idEquipe}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) return;

    usuarioLogado = await res.json();
  } catch (e) {
    console.error("Erro ao buscar usuário logado", e);
  }
}

document.getElementById("formCard").addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = new FormData(e.target);

  const email = dados.get("email");
  const isAdmin = dados.get("isAdmin") === "on";
  const params = new URLSearchParams(window.location.search);
  const id_equipe_fk = Number(params.get("id"));
  const mesangemErro = document.getElementById("mensagemErro");
  const formCard = document.getElementById("formCard");

  try {
    const resposta = await fetch(`${API_BASE}/membro_equipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ email, isAdmin, id_equipe_fk })
    });

    if (!resposta.ok) throw new Error();

    const popup = document.getElementById("popupSucesso");
    popup.textContent = "Membro adicionado com sucesso.";
    popup.classList.add("show");
    formCard.close();

    setTimeout(() => {
      popup.classList.remove("show");
      window.location.reload();
    }, 2000);

  } catch {
    mesangemErro.textContent = "Erro ao adicionar membro.";
  }
});

async function listarMembros() {
  const id = new URLSearchParams(window.location.search).get("id");

  try {
    const resposta = await fetch(`${API_BASE}/membro_equipe?id_equipe=${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!resposta.ok) return;

    const membros = await resposta.json();

    injetarMembros(membros);
    aplicarPermissoesUI();

  } catch (error) {
    console.error(error);
  }
}

function injetarMembros(membros) {
  const tbody = document.getElementById("membros-body");
  tbody.innerHTML = "";

  membros.forEach(membro => {
    const tr = document.createElement("tr");

    const isMembroComum = usuarioLogado && usuarioLogado.id_role_fk > 2;

    const podeAlterar =
      usuarioLogado &&
      (
        usuarioLogado.id_role_fk === 1 ||
        usuarioLogado.id_role_fk < membro.id_role_fk
      );

    tr.innerHTML = `
      <td class="checkbox-cell">
        ${isMembroComum
        ? ""
        : `<input 
            type="checkbox" 
            name="membroSelecionado" 
            value="${membro.id_membro}"
            ${!podeAlterar ? "disabled" : ""}
          >`
      }
      </td>
      <td>${membro.nome}</td>
      <td>${new Date(membro.dt_entrada).toLocaleDateString()}</td>
      <td>${membro.tarefas_atribuidas}</td>
      <td>${membro.cargo}</td>
    `;

    tbody.appendChild(tr);
  });

  adicionarEventListeners();
}

function aplicarPermissoesUI() {
  if (!usuarioLogado) return;

  const confirmDelete = document.getElementById("confirmDelete");
  const confirmAdmin = document.getElementById("confirmAdmin");

  if (usuarioLogado.id_role_fk > 2) {
    confirmDelete.style.display = "none";
    confirmAdmin.style.display = "none";
  }
}

function adicionarEventListeners() {
  if (eventListenersAdded) return;
  eventListenersAdded = true;

  const deleteRequest = document.getElementById("delete-request");
  const adminRequest = document.getElementById("admin-request");
  const confirmDelete = document.getElementById("confirmDelete");
  const confirmAdmin = document.getElementById("confirmAdmin");

  let isDeleting = false;
  let isPromoting = false;

  document.querySelectorAll('input[name="membroSelecionado"]').forEach(cb => {
    cb.addEventListener("change", atualizarRequests);
  });

  confirmDelete.addEventListener("click", async function () {
    if (isDeleting) return;
    isDeleting = true;

    const selected = Array.from(
      document.querySelectorAll('input[name="membroSelecionado"]:checked')
    ).filter(cb => !cb.disabled);

    const ids = selected.map(cb => cb.value);

    if (ids.length === 0) {
      isDeleting = false;
      return;
    }

    try {
      for (const id_membro of ids) {
        await fetch(`${API_BASE}/membro_equipe/${id_membro}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
      }

      listarMembros();
      deleteRequest.style.display = "none";
      adminRequest.style.display = "none";
      const popupSucesso = document.getElementById("popupSucesso");
      popupSucesso.textContent = "Membros deletados com sucesso!";
      popupSucesso.classList.add("show");
      setTimeout(() => {
        popupSucesso.classList.remove("show");
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Erro ao deletar membros", error);
      const popupErro = document.getElementById("popupErro");
      popupErro.textContent = "Erro ao deletar membros.";
      popupErro.classList.add("show");
      setTimeout(() => popupErro.classList.remove("show"), 3000);
    } finally {
      isDeleting = false;
    }
  });

  confirmAdmin.addEventListener("click", async function () {
    if (isPromoting) return;
    isPromoting = true;

    const selected = Array.from(
      document.querySelectorAll('input[name="membroSelecionado"]:checked')
    ).filter(cb => !cb.disabled);

    const ids = selected.map(cb => cb.value);

    if (ids.length === 0) {
      isPromoting = false;
      return;
    }

    try {
      for (const id_membro of ids) {
        await fetch(`${API_BASE}/membro_equipe/${id_membro}/promover`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
      }

      listarMembros();
      deleteRequest.style.display = "none";
      adminRequest.style.display = "none";
      const popupSucesso = document.getElementById("popupSucesso");
      popupSucesso.textContent = "Membros promovidos com sucesso!";
      popupSucesso.classList.add("show");
      setTimeout(() => {
        popupSucesso.classList.remove("show");
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Erro ao promover membros", error);
      const popupErro = document.getElementById("popupErro");
      popupErro.textContent = "Erro ao promover membros.";
      popupErro.classList.add("show");
      setTimeout(() => popupErro.classList.remove("show"), 3000);
    } finally {
      isPromoting = false;
    }
  });
}

function atualizarRequests() {
  const selected = document.querySelectorAll('input[name="membroSelecionado"]:checked');
  const count = selected.length;
  const deleteRequest = document.getElementById("delete-request");
  const adminRequest = document.getElementById("admin-request");

  if (count > 0) {
    document.getElementById("countDelete").textContent = count;
    deleteRequest.style.display = "flex";
    document.getElementById("countAdmin").textContent = count;
    adminRequest.style.display = "flex";
  } else {
    deleteRequest.style.display = "none";
    adminRequest.style.display = "none";
  }
}

window.onload = async function () {
  await buscarUsuarioLogado();
  listarMembros();
};