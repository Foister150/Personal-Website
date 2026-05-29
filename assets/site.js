const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "CLOSE [ - ]" : "MENU [ + ]";
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a") && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "MENU [ + ]";
    }
  });
}

for (const target of document.querySelectorAll("[data-year]")) {
  target.textContent = new Date().getFullYear();
}
