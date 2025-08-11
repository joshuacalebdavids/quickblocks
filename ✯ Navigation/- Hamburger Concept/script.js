document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const menu = document.querySelector(".menu-icon");
  const menuItems = document.querySelectorAll(".nav__list-item");

  menu.addEventListener("click", function () {
    body.classList.toggle("nav-active");
  });
});
