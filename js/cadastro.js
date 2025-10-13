// Validação do formulário de cadastro
document.getElementById("cadastroForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const confirmEmail = document.getElementById("confirmEmail").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmSenha = document.getElementById("confirmSenha").value.trim();
  const mensagemErro = document.getElementById("mensagemErro");
  const popup = document.getElementById("popupSucesso");

  mensagemErro.textContent = "";

  if (email !== confirmEmail) {
    mensagemErro.textContent = "Os e-mails não coincidem.";
    return;
  }

  if (senha !== confirmSenha) {
    mensagemErro.textContent = "As senhas não coincidem.";
    return;
  }

  if (senha.length < 8) {
    mensagemErro.textContent = "A senha deve ter pelo menos 8 caracteres.";
    return;
  }

  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 2000);
});

// Preview da foto de perfil

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("profileInput");
  const img = document.getElementById("profilePreview");
  const changeBtn = document.getElementById("changePhoto");
  const removeBtn = document.getElementById("removePhoto");

  // Abre o seletor de arquivo
  changeBtn.addEventListener("click", () => input.click());

  // Quando uma imagem é selecionada, atualiza preview
  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.readAsDataURL(file);
    }
  });

  // Remove a imagem e volta pro padrão
  removeBtn.addEventListener("click", () => {
    img.src = "default-avatar.png"; 
    input.value = ""; 
  });
});

