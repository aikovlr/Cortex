// preencher dados da tarefa na página

async function carregarTarefa() {
    const params = new URLSearchParams(window.location.search);
    const id_tarefa = params.get("id");
    
    if (!id_tarefa) {
        console.error("ID da tarefa não encontrado");
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/tarefas/${id_tarefa}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!resposta.ok) {
            console.error("Erro ao carregar tarefa. Tente novamente mais tarde.");
            return;
        }
        
        const tarefas = await resposta.json();
        injetarTarefa(tarefas);
        console.log("tarefa", tarefas);
        
    } catch (error) {
        console.error("Erro ao carregar tarefa:", error);
    }
}

function injetarTarefa(tarefas) {

    const titulo = document.getElementById("titulo-tarefa");
    const descricao = document.getElementById("descricao-tarefa");
    const equipeResponsavel = document.getElementById("responsavel");
    const vencimento = document.getElementById("vencimento");

    titulo.innerHTML = tarefas.titulo;
    descricao.innerHTML = `<strong>Instruções:</strong><br>${tarefas.descricao}`;
    equipeResponsavel.innerHTML = `<strong>Atribuída por:</strong> ${tarefas.criador_nome} - ${tarefas.equipe_nome}`;
    vencimento.innerHTML = `<strong>Vence em:</strong> ${new Date(tarefas.dt_vencimento).toLocaleString("pt-BR")}`;
}

// modal helpers used by onclick attributes
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