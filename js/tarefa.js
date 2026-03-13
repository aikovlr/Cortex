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
        
        document.getElementById("titulo-tarefa").textContent = tarefas.titulo;
        document.getElementById("descricao-tarefa").innerHTML =
        `<strong>Instruções:</strong><br>${tarefas.descricao}`;
        document.getElementById("vencimento").textContent =
        `Vence em ${new Date(tarefas.dt_vencimento).toLocaleString("pt-BR")}`;
        
    } catch (error) {
        console.error("Erro ao carregar tarefa:", error);
    }
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