function uniqueArray(a) {
  return [...new Set(a)].sort((a, b) => a.localeCompare(b, "fr"));
}

function unaccent(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function initThemesSuggestions(themes, commonThemes, countThemes) {
  const themesInput = document.getElementById("themes");
  const themesSuggestions = document.getElementById("themes-suggestions");
  const themesCounts = document.getElementById("themes-counts");

  function updateThemesSuggestions() {
    themesInput.value = themesInput.value.toLowerCase();
    const lastWord = themesInput.value.split(",").slice(-1)[0];
    const previousInput = themesInput.value.split(",").slice(0, -1);
    let suggestions = uniqueArray(themes);
    themesCounts.textContent = "";

    themesInput.value
      .split(",")
      .filter((x) => x in countThemes)
      .forEach((tag) => {
        const span = document.createElement("span");
        span.textContent = `${tag} (${countThemes[tag]})`;
        span.setAttribute("class", "label");
        themesCounts.appendChild(span);
      });

    if (previousInput.length > 0) {
      suggestions = uniqueArray(
        previousInput
          .filter((x) => x in commonThemes)
          .map((x) => commonThemes[x])
          .flat()
          .concat(previousInput),
      );
    }

    themesSuggestions.innerHTML = "";
    themesSuggestions.append(
      ...suggestions
        .filter((x) => unaccent(x).startsWith(unaccent(lastWord)))
        .map((x) => {
          const span = document.createElement("span");
          span.classList.add("theme_suggestion");
          span.innerHTML = x;
          if (!previousInput.includes(x)) {
            span.tabIndex = 0;
            span.addEventListener("click", function (event) {
              themesInput.value = previousInput
                .concat([event.srcElement.innerText])
                .join(",");
              themesInput.focus();
              themesInput.dispatchEvent(
                new Event("input", {
                  bubbles: true,
                  cancelable: true,
                }),
              );
            });
            span.addEventListener("keydown", (event) => {
              if (!document.activeElement === span) {
                return;
              }
              if (["Enter", "Space"].includes(event.code)) {
                event.preventDefault();
                span.click();
              }
            });
          } else {
            span.classList.add("active");
          }
          return span;
        }),
    );
  }

  themesInput.addEventListener("input", updateThemesSuggestions);

  return updateThemesSuggestions;
}
