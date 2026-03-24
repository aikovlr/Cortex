document.addEventListener("DOMContentLoaded", function () {

  const fontSizeSlider = document.getElementById("fontRange");
  const saveBtn = document.getElementById("saveBtn");
  const popup = document.getElementById("popupSucesso")
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

  const switchTema = document.getElementById("meuSwitch");
  const background = document.body;
  const styleTag = document.createElement("style");
  document.head.appendChild(styleTag);

  function atualizarEstilos(corHover, bgCard, colorCard, borderCard, colorDesc, corPrevBorder, corBtnFile) {
    styleTag.innerHTML = `
      #teamTable tr:hover {
        background-color: ${corHover} !important;
        transition: background-color 0.3s;
      }
      .team-card {
        background: ${bgCard} !important;
        color: ${colorCard} !important;
        border-color: ${borderCard} !important;
      }
      .team-card p {
        color: ${colorDesc} !important;
      }

      .anexo-item,
      .preview-item {
      border: 2px solid ${corPrevBorder} !important;

      #selectFile {
        background-color: ${corBtnFile} !important;
      }

      }
    `;
  }

  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo === "escuro") {
    if (switchTema) switchTema.checked = true;
    background.style.backgroundColor = '#242424ff';
    background.style.color = '#F5F5F5';
    atualizarEstilos("#483D8B", "#333", "#F5F5F5", "#555", "#ccc", "#f5f5f5", "#F5F5F5");
  } else {
    if (switchTema) switchTema.checked = false;
    background.style.backgroundColor = '#f5f5f5';
    background.style.color = '#242424ff';
    atualizarEstilos("#f3f1f9", "#fff", "#242424ff", "#ddd", "#666", "#242424ff", "#242424ff");
  }

  if (switchTema) {
    switchTema.addEventListener("change", function () {
      if (this.checked) {
        background.style.backgroundColor = '#1C1C1C';
        background.style.color = '#F5F5F5';
        background.style.transition = 'background-color 0.5s, color 0.5s';
        atualizarEstilos("#483D8B", "#333", "#F5F5F5", "#555", "#ccc", "#f5f5f5", "#F5F5F5");
        localStorage.setItem("tema", "escuro");
      } else {
        background.style.backgroundColor = '#f9f9fb';
        background.style.color = '#222';
        background.style.transition = 'background-color 0.5s, color 0.5s';
        atualizarEstilos("#f3f1f9", "#fff", "#242424ff", "#ddd", "#666", "#242424ff", "#242424ff");
        localStorage.setItem("tema", "claro");
      }
    });
  }

  // sidebar toggle
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }
  document.addEventListener('click', function (event) {
    if (sidebar && toggleBtn && !sidebar.contains(event.target) &&
      !toggleBtn.contains(event.target) && window.innerWidth <= 1024) {
      sidebar.classList.remove('open');
    }
  });

  // back button
  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', function () {
      window.history.back();
    });
  }

  // fill current user name if element exists
  const nomeSpan = document.getElementById("userName");
  const storedName = localStorage.getItem("userName");
  if (nomeSpan) {
    nomeSpan.textContent = storedName || "Usuário";
  }

  // user popup for mobile
  const userPhoto = document.getElementById("userPhoto");
  const userPopup = document.getElementById("userPopup");
  const popupLogoutBtn = document.getElementById("popupLogoutBtn");
  const popupNomeSpan = document.getElementById("popupUserName");
  const popupImg = document.getElementById("popupUserPhoto");

  if (popupNomeSpan) {
    popupNomeSpan.textContent = storedName || "Usuário";
  }
  if (popupImg && userPhoto) {
    popupImg.src = userPhoto.src;
  }

  if (userPhoto && userPopup && window.innerWidth <= 1024) {
    userPhoto.addEventListener("click", function (event) {
      event.stopPropagation();
      userPopup.classList.toggle("show");
    });

    // close popup when clicking outside
    document.addEventListener("click", function (event) {
      if (!userPopup.contains(event.target) && !userPhoto.contains(event.target)) {
        userPopup.classList.remove("show");
      }
    });

    // logout from popup
    if (popupLogoutBtn) {
      popupLogoutBtn.addEventListener("click", function () {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '../pages/login.html';
      });
    }
  }

  // cadastro profile preview
  const inputProfile = document.getElementById("profileInput");
  const img = document.getElementById("profilePreview");
  const changeBtn = document.getElementById("changePhoto");
  const removeBtn = document.getElementById("removePhoto");
  if (inputProfile && img && changeBtn && removeBtn) {
    changeBtn.addEventListener("click", () => inputProfile.click());
    inputProfile.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => (img.src = e.target.result);
        reader.readAsDataURL(file);
      }
    });
    removeBtn.addEventListener("click", () => {
      img.src = "default-avatar.png";
      inputProfile.value = "";
    });
  }

  // tarefa page behaviours
  if (document.getElementById("titulo-tarefa")) {
    if (typeof carregarTarefa === "function") carregarTarefa();

    const feedbackContainer = document.getElementById("feedbackContainer");
    const finalizarButton = document.getElementById("finalizar");
    const suggestionButton = document.getElementById("sugestao");
    const fileButton = document.getElementById("customFileButton");

    if (finalizarButton) {
      const taskId = finalizarButton.dataset.id || "tarefaGenerica";
      const finalizadas =
        JSON.parse(localStorage.getItem("tarefasFinalizadas")) || [];
      if (finalizadas.includes(taskId)) {
        marcarComoFinalizada(true);
      }

      window.toggleFeedback = function () {
        const isFinalizado =
          finalizarButton.innerText.trim() === "Finalizar tarefa";

        if (!isFinalizado) {
          marcarComoFinalizada(false);
          const index = finalizadas.indexOf(taskId);
          if (index !== -1) {
            finalizadas.splice(index, 1);
            localStorage.setItem(
              "tarefasFinalizadas",
              JSON.stringify(finalizadas)
            );
          }
          console.log("Envio de tarefa cancelado");
        } else {
          marcarComoFinalizada(true);
          if (!finalizadas.includes(taskId)) {
            finalizadas.push(taskId);
            localStorage.setItem(
              "tarefasFinalizadas",
              JSON.stringify(finalizadas)
            );
          }
          console.log("Envio de tarefa iniciado");
        }
      };

      function marcarComoFinalizada(status) {
        if (status) {
          finalizarButton.innerText = "Cancelar envio";
          suggestionButton.style.display = "none";
          feedbackContainer.style.display = "block";
          fileButton.style.color = "#e63946";
          fileButton.style.border = "2px solid #e63946";
          fileButton.disabled = true;
        } else {
          finalizarButton.innerText = "Finalizar tarefa";
          suggestionButton.style.display = "inline-block";
          feedbackContainer.style.display = "none";
          fileButton.style.color = "#7B4FC9";
          fileButton.style.border = "2px solid #7B4FC9";
          fileButton.disabled = false;
        }
      }
    }

    const popup = document.getElementById("popupSucesso");
    const feedbackSend = document.querySelector("#feedbackContainer button[type='submit']");
    if (feedbackSend && popup) {
      feedbackSend.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById("feedbackDesc").value = '';
        console.log("Feedback de tarefa enviado");
        popup.classList.add("show");
        setTimeout(() => {
          popup.classList.remove("show");
        }, 2000);
      });
    }

    const reportSend = document.querySelector("#report button[type='submit']");
    const reportCard = document.getElementById("report");
    if (reportSend && reportCard && popup) {
      reportSend.addEventListener("click", function (e) {
        e.preventDefault();
        reportCard.close();
        document.getElementById("reportTask").value = '';
        document.getElementById("reportDesc").value = '';
        console.log("Ticket de report enviado");
        popup.classList.add("show");
        setTimeout(() => {
          popup.classList.remove("show");
        }, 2000);
      });
    }

    const suggestionSend = document.querySelector("#suggestion button[type='submit']");
    const suggestionCard = document.getElementById("suggestion");
    if (suggestionSend && suggestionCard && popup) {
      suggestionSend.addEventListener("click", function (e) {
        e.preventDefault();
        suggestionCard.close();
        document.getElementById("suggestionTask").value = '';
        document.getElementById("suggestionDesc").value = '';
        console.log("Sugestão enviada");
        popup.classList.add("show");
        setTimeout(() => {
          popup.classList.remove("show");
        }, 2000);
      });
    }
  }
});