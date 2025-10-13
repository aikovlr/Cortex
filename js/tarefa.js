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

document.addEventListener("DOMContentLoaded", function() {
    const feedbackContainer = document.getElementById("feedbackContainer");
    const finalizarButton = document.getElementById("finalizar");
    const suggestionButton = document.getElementById("sugestao");
    const fileButton = document.getElementById("customFileButton");

    window.toggleFeedback = function() {
        const isFinalizado = finalizarButton.innerText.trim() === "Finalizar tarefa";

        if (!isFinalizado) {
            finalizarButton.innerText = "Finalizar tarefa";
            suggestionButton.style.display = "inline-block";
            feedbackContainer.style.display = "none";
            fileButton.style.color = "#7B4FC9";
            fileButton.style.border = "2px solid #7B4FC9";
            fileButton.disabled = false;
            console.log("Envio de tarefa cancelado");
        } else {
            finalizarButton.innerText = "Cancelar envio";
            suggestionButton.style.display = "none";
            feedbackContainer.style.display = "block";
            fileButton.style.color = "#e63946";
            fileButton.style.border = "2px solid #e63946";
            fileButton.disabled = true;
            console.log("Envio de tarefa iniciado");
        }
}
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

document.addEventListener("DOMContentLoaded", function() {

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

function toggleSuggestion() {
    const suggestionCard = document.getElementById("suggestion");
    if (suggestionCard.open) {
        suggestionCard.close();
        return;
    }

    suggestionCard.showModal();
}

document.addEventListener("DOMContentLoaded", function() {
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