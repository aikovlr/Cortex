// File input da aba tarefa

const fileInput = document.getElementById("fileInput");
const fileButton = document.getElementById("customFileButton");
const fileName = document.getElementById("fileName");

fileButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    fileName.textContent = fileInput.files.length
        ? fileInput.files[0].name
        : " ";
});

// Funcão finalizar tarefa

document.addEventListener("DOMContentLoaded", function () {
    const feedbackContainer = document.getElementById("feedbackContainer");
    const finalizarButton = document.getElementById("finalizar");
    const suggestionButton = document.getElementById("sugestao");
    const fileButton = document.getElementById("customFileButton");

    // pega o ID da tarefa (precisa ter data-id no HTML)
    const taskId = finalizarButton.dataset.id || "tarefaGenerica";

    // restaura o estado salvo
    const finalizadas = JSON.parse(localStorage.getItem("tarefasFinalizadas")) || [];
    if (finalizadas.includes(taskId)) {
        marcarComoFinalizada(true);
    }

    window.toggleFeedback = function () {
        const isFinalizado = finalizarButton.innerText.trim() === "Finalizar tarefa";

        if (!isFinalizado) {
            marcarComoFinalizada(false);

            // remove do localStorage
            const index = finalizadas.indexOf(taskId);
            if (index !== -1) {
                finalizadas.splice(index, 1);
                localStorage.setItem("tarefasFinalizadas", JSON.stringify(finalizadas));
            }

            console.log("Envio de tarefa cancelado");
        } else {
            marcarComoFinalizada(true);

            // salva no localStorage
            if (!finalizadas.includes(taskId)) {
                finalizadas.push(taskId);
                localStorage.setItem("tarefasFinalizadas", JSON.stringify(finalizadas));
            }

            console.log("Envio de tarefa iniciado");
        }
    };

    function marcarComoFinalizada(status) {
        if (status) {
            finalizarButton.innerText = "Cancelar envio";
            suggestionButton.style.display = "none";
            feedbackContainer.style.display = "block";
            fileButton.style.color = "#e63946";
            fileButton.style.border = "2px solid #e63946";
            fileButton.disabled = true;
        } else {
            finalizarButton.innerText = "Finalizar tarefa";
            suggestionButton.style.display = "inline-block";
            feedbackContainer.style.display = "none";
            fileButton.style.color = "#7B4FC9";
            fileButton.style.border = "2px solid #7B4FC9";
            fileButton.disabled = false;
        }
    }
});

// popup de sucesso ao enviar feedback
document.addEventListener("DOMContentLoaded", function () {

    const sendButton = document.querySelector("#feedbackContainer button[type='submit']");
    const feedbackCard = document.getElementById("sendFeedback");
    const popup = document.getElementById("popupSucesso");

    sendButton.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById("feedbackDesc").value = '';
        console.log("Feedback de tarefa enviado");

        popup.classList.add("show");

        setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
    });
});

// Funções para abrir e fechar o card de report e sugestão

function toggleReport() {
    const reportCard = document.getElementById("report");
    if (reportCard.open) {
        report.close();
        return;
    }

    reportCard.showModal();
}
// popup de sucesso ao enviar report
document.addEventListener("DOMContentLoaded", function () {

    const sendButton = document.querySelector("#report button[type='submit']");
    const reportCard = document.getElementById("report");
    const popup = document.getElementById("popupSucesso");

    sendButton.addEventListener("click", function (e) {
        e.preventDefault();
        reportCard.close();
        document.getElementById("reportTask").value = '';
        document.getElementById("reportDesc").value = '';
        console.log("Ticket de report enviado");

        popup.classList.add("show");

        setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
    });
});
// abrir card sugestão
function toggleSuggestion() {
    const suggestionCard = document.getElementById("suggestion");
    if (suggestionCard.open) {
        suggestionCard.close();
        return;
    }

    suggestionCard.showModal();
}
// popup de sucesso ao enviar sugestão
document.addEventListener("DOMContentLoaded", function () {
    const sendButton = document.querySelector("#suggestion button[type='submit']");
    const suggestCard = document.getElementById("suggestion");
    const popup = document.getElementById("popupSucesso");

    sendButton.addEventListener("click", function (e) {
        e.preventDefault();
        suggestCard.close();
        document.getElementById("suggestionTask").value = '';
        document.getElementById("suggestionDesc").value = '';
        console.log("Sugestão enviada");

        popup.classList.add("show");

        setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
    });
});