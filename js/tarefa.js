// preencher dados da tarefa na página
document.addEventListener("DOMContentLoaded", () => {
    carregarTarefa();
});

async function carregarTarefa() {

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
        const resposta = await fetch(`${API_BASE}/tarefas/${id_tarefa}`, {
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

        const resAnexos = await fetch(`${API_BASE}/anexo/${id_tarefa}`, {
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

        injetarTarefa(tarefa, anexos);

        console.log("TAREFA:", tarefa);
        console.log("ANEXOS:", anexos);

    } catch (error) {
        console.error("Erro geral:", error);
    }
}

function injetarTarefa(tarefa, anexos = []) {

    const titulo = document.getElementById("titulo-tarefa");
    const descricao = document.getElementById("descricao-tarefa");
    const criador = document.getElementById("responsavel");
    const vencimento = document.getElementById("vencimento");

    // título
    titulo.innerText = tarefa.titulo || "Sem título";

    // descrição
    descricao.innerHTML = tarefa.descricao
        ? `<strong>Instruções:</strong><br>${tarefa.descricao}`
        : "<strong>Sem descrição</strong>";

    // responsável (usuário OU equipe)
    criador.innerHTML = `
        <strong>Atribuida por:</strong> 
        ${tarefa.criador_nome || "Não definido"}
        ${tarefa.equipe_nome ? ` - ${tarefa.equipe_nome}` : ""}
        `;

    // vencimento
    vencimento.innerHTML = tarefa.dt_vencimento
        ? `<strong>Vence em:</strong> ${new Date(tarefa.dt_vencimento).toLocaleString("pt-BR")}`
        : "<strong>Sem vencimento</strong>";

    // anexos
    renderAnexosTarefa(anexos);
}

function toggleReport() {
    const reportCard = document.getElementById("report");
    if (reportCard.open) {
        reportCard.close();
        return;
    }
    reportCard.showModal();
}

function toggleSuggestion() {
    const suggestionCard = document.getElementById("suggestion");
    if (suggestionCard.open) {
        suggestionCard.close();
        return;
    }
    suggestionCard.showModal();
}