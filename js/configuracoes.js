const telInput = document.getElementById("accountTelefone")
VMasker(telInput).maskPattern("99 99999-9999")

// Funções de suporte
function alternarModoEdicao(editando) {
    const camposTexto = ["accountNome", "accountTelefone", "accountEmail"];
    camposTexto.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !editando;
    });

    document.getElementById("editBtn").style.display = editando ? "none" : "block";
    document.getElementById("saveActions").style.display = editando ? "block" : "none";

    const passwordBlock = document.getElementById("passwordBlock");
    if (passwordBlock) passwordBlock.style.display = editando ? "block" : "none";

    const photoActions = document.getElementById("profilePhotoButtons");
    if (photoActions) photoActions.style.display = editando ? "flex" : "none";
}

// Inicialização única dos eventos
document.addEventListener("DOMContentLoaded", () => {

    const accountForm = document.getElementById("accountForm");
    if (!accountForm) return;

    const editBtn = document.getElementById("editBtn");
    const cancelBtn = document.getElementById("cancelBtn");


    editBtn.addEventListener("click", () => alternarModoEdicao(true));

    cancelBtn.addEventListener("click", () => {
        alternarModoEdicao(false);
        carregarDadosConta();
    });


    // Submit do Formulário
    accountForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const popupErro = document.getElementById("popupErro");
        const popupSucesso = document.getElementById("popupSucesso");
        popupErro.classList.remove("show");
        popupSucesso.classList.remove("show");

        const token = localStorage.getItem("token");
        const formData = new FormData(accountForm);

        // Validação da senha
        const senhaNova = formData.get("senhaNova");
        const senhaConfirm = formData.get("senhaConfirm");
        if (senhaNova && senhaNova.length < 8) {
            popupErro.textContent = "A nova senha deve ter pelo menos 8 caracteres.";
            popupErro.classList.add("show");
            setTimeout(() => popupErro.classList.remove("show"), 3000);
            return;
        }
        if (senhaNova !== senhaConfirm) {
            popupErro.textContent = "As senhas não coincidem.";
            popupErro.classList.add("show");
            setTimeout(() => popupErro.classList.remove("show"), 3000);
            return;
        }

        // Ajuste do nome do campo para o Multer
        const arquivo = formData.get("foto");
        formData.delete("foto");

        if (arquivo && arquivo.size > 0) {
            formData.append("anexo", arquivo);
        }

        try {
            const res = await fetch(`${API_BASE}/usuarios/me`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const contentType = res.headers.get("content-type");
            if (res.ok && contentType && contentType.includes("application/json")) {
                popupSucesso.classList.add("show");
                setTimeout(() => popupSucesso.classList.remove("show"), 3000);
                alternarModoEdicao(false);
                carregarDadosConta();
                setTimeout(() => window.location.reload(), 2000); // Delay reload to show message
            } else {
                const textoErro = await res.text();
                console.error("Erro do servidor:", textoErro);
                popupErro.textContent = "Erro ao salvar alterações.";
                popupErro.classList.add("show");
                setTimeout(() => popupErro.classList.remove("show"), 3000);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            popupErro.textContent = "Erro na requisição.";
            popupErro.classList.add("show");
            setTimeout(() => popupErro.classList.remove("show"), 3000);
        }
    });

    // Remover Foto
    const rmvPhotoBtn = document.getElementById("removePhoto");
    if (rmvPhotoBtn) {
        rmvPhotoBtn.addEventListener("click", async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch(`${API_BASE}/usuarios/me/avatar`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    document.getElementById("profilePreview").src = "../images/perfil.png";
                } else {
                    const textoErro = await res.text();
                    console.error("Erro do servidor:", textoErro);
                    const popupErro = document.getElementById("popupErro");
                    popupErro.textContent = "Erro ao remover foto.";
                    popupErro.classList.add("show");
                    setTimeout(() => popupErro.classList.remove("show"), 3000);
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
                const popupErro = document.getElementById("popupErro");
                popupErro.textContent = "Erro na requisição.";
                popupErro.classList.add("show");
                setTimeout(() => popupErro.classList.remove("show"), 3000);
            }
        });
    }

    // Carregar dados iniciais
    carregarDadosConta();
});