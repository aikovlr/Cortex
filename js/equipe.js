function toggleForm() {
  const formCard = document.getElementById("formCard");
  
  if (formCard.open) {
    formCard.close();
    return;
  }

  formCard.showModal();
}

document.getElementById("memberForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const cargo = document.getElementById("cargo").value;
  const hoje = new Date().toLocaleDateString("pt-BR");
  const popup = document.getElementById("popupSucesso");

  const tabela = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
  const novaLinha = tabela.insertRow();

  novaLinha.insertCell(0).innerText = nome;
  novaLinha.insertCell(1).innerText = hoje;
  novaLinha.insertCell(2).innerText = "0";
  novaLinha.insertCell(3).innerText = cargo;

  // Esconde o formulário de novo
  toggleForm();

  // Limpa os inputs
  document.getElementById("memberForm").reset();

  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 2000);
});
