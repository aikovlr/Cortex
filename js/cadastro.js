const cpfInput = document.getElementById("cpf");
const telInput = document.getElementById("contato")
VMasker(telInput).maskPattern("99 99999-9999")
VMasker(cpfInput).maskPattern("999.999.999-99")

// Validação do formulário de cadastro
document.getElementById("cadastroForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const dados = new FormData(e.target);

  const email = dados.get("email").trim();
  const confirmEmail = dados.get("confirmEmail").trim();
  const senha = dados.get("senha").trim();
  const confirmSenha = dados.get("confirmSenha").trim();

  const dataForms = {
    nome: dados.get('nome').trim(),
    cpf: dados.get('cpf').trim(),
    telefone: dados.get('contato').trim(),
    email,
    senha,
  }

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
    const resposta = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataForms }), // ok com o servidor atual; ou JSON.stringify(dataForms) se preferir plano
    });

    if (!resposta.ok) {
      const err = await resposta.json().catch(() => ({}));
      throw new Error(err.message || "Erro na resposta do servidor");
    }
    const { token } = await resposta.json();

    const file = dados.get("anexo");
    if (file && file.size > 0 && token) {
      const fd = new FormData();
      fd.append("anexo", file);
      const fotoUpload = await fetch(`${API_BASE}/usuarios/anexo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      
      if (!fotoUpload.ok) {
        mensagemErro.textContent = "Erro ao enviar anexo.";
        return;
      }
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




