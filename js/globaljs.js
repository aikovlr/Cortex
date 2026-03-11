document.addEventListener("DOMContentLoaded", function () {
  const switchTema = document.getElementById("meuSwitch");
  const background = document.body;
  const styleTag = document.createElement("style");
  document.head.appendChild(styleTag); // adiciona um <style> dinâmico pro hover
 
  // função pra atualizar o hover dinamicamente
  function atualizarHover(corHover) {
    styleTag.innerHTML = `
      #teamTable tr:hover {
        background-color: ${corHover} !important;
        transition: background-color 0.3s;
      }
    `;
  }

  // Recupera o estado salvo
  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo === "escuro") {
    switchTema.checked = true;
    background.style.backgroundColor = '#242424ff';
    background.style.color = '#F5F5F5';
    atualizarHover("#483D8B");
  } else {
    switchTema.checked = false;
    background.style.backgroundColor = '#f9f9fb';
    background.style.color = '#222';
    atualizarHover("#f3f1f9");
  }

  // Listener pra alternar tema e salvar no localStorage
  switchTema.addEventListener("change", function () {
    if (this.checked) {
      background.style.backgroundColor = '#1C1C1C';
      background.style.color = '#F5F5F5';
      background.style.transition = 'background-color 0.5s, color 0.5s';
      atualizarHover("#483D8B");
      localStorage.setItem("tema", "escuro");
      console.log("Black theme switch is ON");
    } else {
      background.style.backgroundColor = '#f9f9fb';
      background.style.color = '#222';
      background.style.transition = 'background-color 0.5s, color 0.5s';
      atualizarHover("#f3f1f9");
      localStorage.setItem("tema", "claro");
      console.log("Black theme switch is OFF");
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }

  // Opcional: Feche a sidebar ao clicar fora dela (no mobile)
  document.addEventListener('click', function(event) {
    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target) && window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', function() {
      window.history.back();
    });
  }});