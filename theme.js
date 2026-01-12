function detectColorScheme() {
  var theme = "dark";

  if (localStorage.getItem("theme")) {
    if (localStorage.getItem("theme") == "light") {
      var theme = "light";
    }
  } else if (!window.matchMedia) {
    return false;
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    var theme = "light";
  }

  if (theme == "light") {
    document.documentElement.setAttribute("data-theme", "light");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  detectColorScheme();

  const toggleSwitch = document.querySelector("#checkbox_theme");

  if (toggleSwitch) {
    function switchTheme(e) {
      if (e.target.checked) {
        localStorage.setItem("theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        toggleSwitch.checked = true;
      } else {
        localStorage.setItem("theme", "dark");
        document.documentElement.removeAttribute("data-theme");
        toggleSwitch.checked = false;
      }
    }

    toggleSwitch.addEventListener("change", switchTheme, false);

    if (document.documentElement.getAttribute("data-theme") == "light") {
      toggleSwitch.checked = true;
    }
  }
});
