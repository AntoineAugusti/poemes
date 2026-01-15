function isLightMode() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function setTheme(theme) {
  const toggleSwitch = document.querySelector("#checkbox_theme");

  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    if (toggleSwitch) toggleSwitch.checked = true;
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
    if (toggleSwitch) toggleSwitch.checked = false;
  }
}

function toggleTheme() {
  setTheme(isLightMode() ? "dark" : "light");
}

function detectColorScheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    setTheme("light");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  detectColorScheme();

  const toggleSwitch = document.querySelector("#checkbox_theme");
  if (toggleSwitch) {
    toggleSwitch.addEventListener("change", toggleTheme);
  }

  document.addEventListener("keydown", function (e) {
    const searchInput = document.getElementById("search");
    if (searchInput === document.activeElement) return;
    if (e.key === "d") {
      toggleTheme();
    }
  });
});
