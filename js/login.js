document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = new FormData(e.target);

    const email = dados.get("email").trim();
    const senha = dados.get("senha").trim();

    const mensagemErro = document.getElementById("mensagemErro");
    const popup = document.getElementById("popupSucesso");
    mensagemErro.textContent = "";

    // busca no banco de dados as credenciais do usuario
    try {
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha, })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemErro.textContent = dados.message || "Erro ao realizar login. Tente novamente mais tarde.";
            return
        }
        // armazena o token de login no localStorage
        localStorage.setItem("token", dados.token);

    } catch (error) {
        mensagemErro.textContent = "Erro ao realizar login. Tente novamente mais tarde.";
        return;
    }

    // exibe popup de sucesso e redireciona para a página inicial
    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
        window.location.href = "/index.html";
    }, 2000);
});
