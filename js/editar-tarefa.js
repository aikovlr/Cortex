// Carregar tarefa para edição
document.addEventListener("DOMContentLoaded", () => {
    carregarTarefaParaEdicao();

    // Botão voltar
    document.getElementById("btn-back").addEventListener("click", () => {
        window.history.back();
    });
});

let anexosParaDeletar = []; // Array para armazenar IDs de anexos a deletar

async function carregarTarefaParaEdicao() {
    const params = new URLSearchParams(window.location.search);
    const id_tarefa = params.get("id");

    if (!id_tarefa) {
        console.error("ID da tarefa não encontrado");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        console.error("Token não encontrado");
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/tarefas/${id_tarefa}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            console.error("Erro ao carregar tarefa:", resposta.status, erro);
            return;
        }

        const tarefa = await resposta.json();

        const resAnexos = await fetch(`http://localhost:3000/anexo/${id_tarefa}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        let anexos = [];

        if (resAnexos.ok) {
            anexos = await resAnexos.json();
        } else {
            console.error("Erro ao buscar anexos:", resAnexos.status);
        }

        preencherCamposEdicao(tarefa, anexos);

        console.log("TAREFA:", tarefa);
        console.log("ANEXOS:", anexos);

    } catch (error) {
        console.error("Erro geral:", error);
    }
}

function preencherCamposEdicao(tarefa, anexos = []) {
    const tituloInput = document.getElementById("titulo-tarefa");
    const descricaoTextarea = document.getElementById("descricao-tarefa");
    const dtVencimentoInput = document.getElementById("dt_vencimento");
    const pontuacaoInput = document.getElementById("pontuacao");
    const prioridadeSelect = document.getElementById("prioridade");

    // Título
    tituloInput.value = tarefa.titulo || "";

    // Descrição
    descricaoTextarea.value = tarefa.descricao || "";

    // Data de vencimento
    if (tarefa.dt_vencimento) {
        const date = new Date(tarefa.dt_vencimento);
        dtVencimentoInput.value = date.toISOString().split('T')[0];
    }

    // Pontuação
    pontuacaoInput.value = tarefa.pontuacao || 0;

    // Prioridade
    const prioridadeMap = {
        "Baixa": "baixa",
        "Média": "media",
        "Alta": "alta",
        "Urgente" : "urgente",
    };
    prioridadeSelect.value = prioridadeMap[tarefa.prioridade];

    // Anexos
    renderAnexosEdicao(anexos);
}

// Renderizar anexos com botão de remoção
function renderAnexosEdicao(anexos) {
    const container = document.getElementById("anexosContainer");

    container.innerHTML = "";

    anexos.forEach(anexo => {
        const item = document.createElement("div");
        item.classList.add("anexo-item");

        const nomeArquivo = anexo.url_caminho.split("/").pop();

        const icon = document.createElement("div");
        icon.classList.add("anexo-icon");

        if (anexo.mime_type.includes("pdf")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#E53935">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
    </svg>`;
        } else if (anexo.mime_type.includes("image")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#43A047">
      <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14"/>
      <circle cx="8" cy="8" r="2"/>
      <path d="M21 15l-5-5L5 21h14z"/>
    </svg>`;
        } else if (anexo.mime_type.includes("zip")) {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FB8C00">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6z"/>
      <rect x="10" y="7" width="2" height="2"/>
      <rect x="10" y="11" width="2" height="2"/>
      <rect x="10" y="15" width="2" height="2"/>
    </svg>`;
        } else {
            icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#5C6BC0">
      <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6z"/>
    </svg>`;
        }

        const name = document.createElement("div");
        name.classList.add("anexo-nome");
        name.textContent = anexo.nome_original;

        const download = document.createElement("a");
        download.href = `http://localhost:3000/anexo/download/${nomeArquivo}`;
        download.classList.add("anexo-download");
        download.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="svg">
              <path d="M.5 9.9v2.6A1.5 1.5 0 0 0 2 14h12a1.5 1.5 0 0 0 1.5-1.5V9.9h-1v2.6a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V9.9h-1z"/>
              <path d="M7.646 10.854a.5.5 0 0 0 .708 0l3-3-.708-.708L8.5 9.293V1.5h-1v7.793L5.354 7.146l-.708.708 3 3z"/>
            </svg>
        `;

        // Download com token
        download.addEventListener("click", (e) => {
            e.preventDefault();

            fetch(download.href, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
                .then(res => res.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = anexo.nome_original;
                    a.click();
                    window.URL.revokeObjectURL(url);
                });
        });

        // Botão de remoção
        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-btn");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
            // Marcar para deletar e esconder
            anexosParaDeletar.push(anexo.id_anexo);
            item.style.display = "none";
        });

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(download);
        item.appendChild(removeBtn);

        container.appendChild(item);
    });
}

async function excluirTarefa() {
    const params = new URLSearchParams(window.location.search);
    const id_tarefa = params.get("id");
    const token = localStorage.getItem("token");

    if (!id_tarefa || !token) return;

    if (!confirm("Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/tarefas/${id_tarefa}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (resposta.ok) {
            alert("Tarefa excluída com sucesso!");
            window.location.href = "tarefas-atribuidas.html"; // Redirecionar para a lista
        } else {
            alert("Erro ao excluir tarefa.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao excluir tarefa.");
    }
}

// Salvar alterações
document.getElementById("salvar").addEventListener("click", salvarAlteracoes);

// Excluir tarefa
document.getElementById("excluir").addEventListener("click", () => {
    document.getElementById("confirmDelete").showModal();
});

function fecharModalDelete() {
    document.getElementById("confirmDelete").close();
}

function fecharModalSuccess() {
    document.getElementById("successDelete").close();
    window.location.href = "tarefas-atribuidas.html"; // Redirecionar após fechar
}

async function confirmarExclusao() {
    fecharModalDelete();
    const params = new URLSearchParams(window.location.search);
    const id_tarefa = params.get("id");
    const token = localStorage.getItem("token");

    if (!id_tarefa || !token) return;

    try {
        const resposta = await fetch(`http://localhost:3000/tarefas/${id_tarefa}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (resposta.ok) {
            document.getElementById("successDelete").showModal();
        } else {
            alert("Erro ao excluir tarefa.");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao excluir tarefa.");
    }
}

async function salvarAlteracoes() {
    const params = new URLSearchParams(window.location.search);
    const id_tarefa = params.get("id");
    const token = localStorage.getItem("token");

    if (!id_tarefa || !token) return;

    const titulo = document.getElementById("titulo-tarefa").value;
    const descricao = document.getElementById("descricao-tarefa").value;
    const dt_vencimento = document.getElementById("dt_vencimento").value;
    const pontuacao = document.getElementById("pontuacao").value;
    const prioridade = document.getElementById("prioridade").value;

    try {
        // Atualizar tarefa
        const resposta = await fetch(`http://localhost:3000/tarefas/${id_tarefa}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                titulo: titulo,
                descricao: descricao,
                dt_vencimento: dt_vencimento || null,
                pontuacao: parseInt(pontuacao) || 0,
                prioridade: prioridade
            })
        });

        if (!resposta.ok) {
            console.error("Erro ao salvar tarefa");
            return;
        }

        // Enviar novos anexos
        if (files.length > 0) {
            const formData = new FormData();
            files.forEach(file => {
                formData.append("anexo", file);
            });

            const resUpload = await fetch(`http://localhost:3000/tarefas/${id_tarefa}/anexo`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (resUpload.ok) {
                // Limpar novos anexos
                files = [];
                document.getElementById("previewContainer").innerHTML = "";
            } else {
                console.error("Erro ao enviar anexos");
            }
        }

        // Deletar anexos marcados
        for (const id_anexo of anexosParaDeletar) {
            await fetch(`http://localhost:3000/tarefas/${id_tarefa}/anexo/${id_anexo}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
        anexosParaDeletar = []; // Limpar array

        // Mostrar popup de sucesso
        const popup = document.getElementById("popupSucesso");
        popup.classList.add("show");
        setTimeout(() => {
            popup.classList.remove("show");
        }, 3000); // Esconder após 3 segundos

    } catch (error) {
        console.error("Erro:", error);
    }
}