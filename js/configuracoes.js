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

        const token = localStorage.getItem("token");
        const formData = new FormData(accountForm);

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
                alternarModoEdicao(false);
                carregarDadosConta();
                window.location.reload();
            } else {
                const textoErro = await res.text();
                console.error("Erro do servidor:", textoErro);
                alert("Erro ao salvar alterações.");
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
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
                    alert("Erro ao remover foto.");
                }
            } catch (error) {
                console.error("Erro na requisição:", error);
            }
        });
    }

    // Carregar dados iniciais
    carregarDadosConta();
});