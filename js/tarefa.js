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

    sendButton.addEventListener("click", function (e) {
        e.preventDefault(); 
        reportCard.close();
        document.getElementById("task").value = '';
        document.getElementById("desc").value = '';
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

    sendButton.addEventListener("click", function (e) {
        e.preventDefault(); 
        suggestCard.close();
        document.getElementById("task").value = '';
        document.getElementById("desc").value = '';
    });
});