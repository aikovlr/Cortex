document.addEventListener("DOMContentLoaded", function () {
  // Configurações de Fonte
  const fontSizeSlider = document.getElementById("fontRange");
  const saveBtn = document.getElementById("saveBtn");
  const popup = document.getElementById("popupSucesso");
  const fontSalva = localStorage.getItem("fontSize");

  if (fontSalva) {
    aplicarFonte(fontSalva);
  }

  if (fontSizeSlider && fontSalva) {
    fontSizeSlider.value = fontSalva;
  }

  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", () => {
      aplicarFonte(fontSizeSlider.value);
    });
  }

  if (fontSizeSlider && saveBtn) {
    saveBtn.addEventListener("click", () => {
      localStorage.setItem("fontSize", fontSizeSlider.value);
      popup.classList.add("show");
      setTimeout(() => {
        popup.classList.remove("show");
      }, 2000);
    });
  }

  function aplicarFonte(valor) {
    let tamanho;
    if (valor == 1) tamanho = "14px";
    if (valor == 2) tamanho = "16px";
    if (valor == 3) tamanho = "24px";
    document.body.style.fontSize = tamanho;
  }

  // Lógica de Tema (Light/Dark)
  const switchTema = document.getElementById("meuSwitch");
  const background = document.body;
  const styleTag = document.createElement("style");
  document.head.appendChild(styleTag);

  function atualizarEstilos(corHover, bgCard, colorCard, borderCard, colorDesc, corPrevBorder, corBtnFile) {
    styleTag.innerHTML = `
      #teamTable tr:hover { background-color: ${corHover} !important; transition: background-color 0.3s; }
      .team-card { background: ${bgCard} !important; color: ${colorCard} !important; border-color: ${borderCard} !important; }
      .team-card p { color: ${colorDesc} !important; }
      .anexo-item, .preview-item { border: 2px solid ${corPrevBorder} !important; }
      #selectFile { background-color: ${corBtnFile} !important; }
    `;
  }

  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo === "escuro") {
    if (switchTema) switchTema.checked = true;
    background.style.backgroundColor = '#242424ff';
    background.style.color = '#F5F5F5';
    atualizarEstilos("#483D8B", "#333", "#F5F5F5", "#555", "#ccc", "#f5f5f5", "transparent");
  } else {
    if (switchTema) switchTema.checked = false;
    background.style.backgroundColor = '#f5f5f5';
    background.style.color = '#242424ff';
    atualizarEstilos("#f3f1f9", "#fff", "#242424ff", "#ddd", "#666", "#242424ff", "transparent");
  }

  if (switchTema) {
    switchTema.addEventListener("change", function () {
      background.style.transition = 'background-color 0.5s, color 0.5s';
      if (this.checked) {
        background.style.backgroundColor = '#1C1C1C';
        background.style.color = '#F5F5F5';
        atualizarEstilos("#483D8B", "#333", "#F5F5F5", "#555", "#ccc", "#f5f5f5", "#F5F5F5");
        localStorage.setItem("tema", "escuro");
      } else {
        background.style.backgroundColor = '#f9f9fb';
        background.style.color = '#222';
        atualizarEstilos("#f3f1f9", "#fff", "#242424ff", "#ddd", "#666", "#242424ff", "#242424ff");
        localStorage.setItem("tema", "claro");
      }
    });
  }

  // Sidebar e Botão Voltar
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  document.addEventListener('click', (event) => {
    if (sidebar && toggleBtn && !sidebar.contains(event.target) && !toggleBtn.contains(event.target) && window.innerWidth <= 1024) {
      sidebar.classList.remove('open');
    }
  });

  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => window.history.back());
  }

  // --- ALTERAÇÃO SOLICITADA: EXIBIÇÃO DE NOME E FOTO DO USUÁRIO ---
  const nomeSpan = document.getElementById("userName");
  const popupNomeSpan = document.getElementById("popupUserName");
  const userPhoto = document.getElementById("userPhoto");
  const popupImg = document.getElementById("popupUserPhoto");
  const profilePreviewEl = document.getElementById("profilePreview");

  // Primeiro, carrega o que estiver no localStorage para evitar delay visual
  const storedName = localStorage.getItem("userName");
  if (nomeSpan) nomeSpan.textContent = storedName || "Usuário";
  if (popupNomeSpan) popupNomeSpan.textContent = storedName || "Usuário";

  // Busca dados reais do banco (Nome e Foto)
  (async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // 1. Buscamos o objeto completo do usuário para pegar o NOME real do banco
      const resUser = await fetch(`${API_BASE}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resUser.ok) {
        const u = await resUser.json();
        // Atualiza o DOM com o nome vindo do banco
        if (nomeSpan) nomeSpan.textContent = u.nome || "Usuário";
        if (popupNomeSpan) popupNomeSpan.textContent = u.nome || "Usuário";
        localStorage.setItem("userName", u.nome || "");
      }

      // 2. Buscamos a FOTO de perfil
      const src = await carregarFotoPerfil();
      const fallback = "../images/perfil.png"; // Ajustado para seu caminho de imagens
      const url = src || fallback;

      if (userPhoto) userPhoto.src = url;
      if (popupImg) popupImg.src = url;
      if (profilePreviewEl) profilePreviewEl.src = src || "../images/perfil.png";

    } catch (err) {
      console.error("Erro ao sincronizar dados do header:", err);
    }
  })();

  // Popup de Usuário (Mobile)
  const userPopup = document.getElementById("userPopup");
  const popupLogoutBtn = document.getElementById("popupLogoutBtn");

  if (userPhoto && userPopup && window.innerWidth <= 1024) {
    userPhoto.addEventListener("click", (event) => {
      event.stopPropagation();
      userPopup.classList.toggle("show");
    });

    document.addEventListener("click", (event) => {
      if (!userPopup.contains(event.target) && !userPhoto.contains(event.target)) {
        userPopup.classList.remove("show");
      }
    });

    if (popupLogoutBtn) {
      popupLogoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = '../pages/login.html';
      });
    }
  }

  // Lógica de Foto em Configurações (Se existir na página)
  const inputProfile = document.getElementById("profileInput");
  const imgPreview = document.getElementById("profilePreview");
  const changeBtn = document.getElementById("changePhoto");
  const removeBtn = document.getElementById("removePhoto");

  if (inputProfile && imgPreview && changeBtn) {
    changeBtn.onclick = (e) => {
      e.preventDefault();
      inputProfile.click();
    };

    inputProfile.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => (imgPreview.src = e.target.result);
        reader.readAsDataURL(file);
      }
    });
  }
});
const API_BASE = "http://localhost:3000";

async function carregarFotoPerfil() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const resposta = await fetch(`${API_BASE}/usuarios/me/avatar`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error("Erro ao carregar foto");

    const { url } = await resposta.json();
    return new URL(url, API_BASE).href;
  } catch (error) {
    console.error("Erro ao buscar foto de perfil", error);
    return null;
  }
}

async function carregarDadosConta() {
  const token = localStorage.getItem("token");
  if (!token) return console.error("Token não encontrado");

  try {
      const res = await fetch(`${API_BASE}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao carregar conta");

      const u = await res.json();

      document.getElementById("accountNome").value = u.nome || "";
      document.getElementById("accountEmail").value = u.email || "";
      document.getElementById("accountTelefone").value = u.telefone || "";

      if (typeof carregarFotoPerfil === 'function') {
          const fotoUrl = await carregarFotoPerfil();
          if (fotoUrl) {
              document.getElementById("profilePreview").src = fotoUrl;
          }
      }
  } catch (e) {
      console.error(e);
  }
}
