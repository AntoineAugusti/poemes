function detectColorScheme() {
  var theme = "light";

  if (localStorage.getItem("theme")) {
    if (localStorage.getItem("theme") == "dark") {
      var theme = "dark";
    }
  } else if (!window.matchMedia) {
    return false;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    var theme = "dark";
  }

  if (theme == "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  detectColorScheme();

  const toggleSwitch = document.querySelector("#checkbox_theme");

  if (toggleSwitch) {
    function switchTheme(e) {
      if (e.target.checked) {
        localStorage.setItem("theme", "dark");
        document.documentElement.setAttribute("data-theme", "dark");
        toggleSwitch.checked = true;
      } else {
        localStorage.setItem("theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        toggleSwitch.checked = false;
      }
    }

    toggleSwitch.addEventListener("change", switchTheme, false);

    if (document.documentElement.getAttribute("data-theme") == "dark") {
      toggleSwitch.checked = true;
    }
  }
});
