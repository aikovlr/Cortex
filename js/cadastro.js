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




