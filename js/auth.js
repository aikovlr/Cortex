// só permite que o usuario acesse a página se estiver logado

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/pages/login.html";
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  // Remove token e dados do usuário do localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redireciona pra página de login
  window.location.href = '../pages/login.html';
});

document.addEventListener("DOMContentLoaded", () => {
  const nome = localStorage.getItem("userName");
  const spanNome = document.getElementById("userName");

  if (nome && spanNome) {
    spanNome.textContent = nome;
  } else {
    spanNome.textContent = "Usuário";
  }
});
