// só permite que o usuario acesse a página se estiver logado

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/pages/login.html";
}