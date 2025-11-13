function toggleForm() {
  const formCard = document.getElementById("formCard");

  if (formCard.open) {
    formCard.close();
    return;
  }

  formCard.showModal();
}
