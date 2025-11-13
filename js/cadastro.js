// Validação do formulário de cadastro
document.getElementById("cadastroForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = new FormData(e.target);

  const nome = dados.get('nome').trim();
  const cpf = dados.get('cpf').trim();
  const telefone = dados.get('contato').trim();
  const email = dados.get("email").trim();
  const confirmEmail = dados.get("confirmEmail").trim();
  const senha = dados.get("senha").trim();
  const confirmSenha = dados.get("confirmSenha").trim();

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

  // Envia os dados para o servidor/db
  try {
    const resposta = await fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nome, cpf, telefone, email, senha, })
    });

    if (!resposta.ok) {
      throw new Error('Erro na resposta do servidor');
    }
  } catch (error) {
    mensagemErro.textContent = "Erro ao cadastrar. Tente novamente mais tarde.";
    return;
  }

  // popup de sucesso, manda para a pagina inicial dps de 2 segundos
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    window.location.href = "../pages/login.html";
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



