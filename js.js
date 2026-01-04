/*global Mark*/

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toggleReverse(div) {
  if (div.classList.contains("reverse")) {
    div.classList.remove("reverse");
  } else {
    div.classList.add("reverse");
  }
}

function hide(div) {
  div.classList.remove("visible");
  div.classList.add("hidden");
}

function show(div) {
  div.classList.remove("hidden");
  div.classList.add("visible");
}

function includesAnyWord(text, words) {
  return words.some((word) => text.includes(word));
}

function highlightText(searchTerm) {
  removeHighlight();

  if (!searchTerm.trim()) {
    return;
  }

  if (searchTerm != normalize(searchTerm)) {
    highlightText(normalize(searchTerm));
  }

  const context = document.querySelectorAll(".poemes-container .poeme.visible");
  let separateWordSearch = true;
  if (searchTerm.startsWith('"') || searchTerm.startsWith("#")) {
    separateWordSearch = false;
  }

  new Mark(context).mark(searchTerm.replaceAll('"', "").replaceAll("#", ""), {
    separateWordSearch: separateWordSearch,
  });
}

function removeHighlight() {
  const context = document.querySelectorAll(".poemes-container .poeme.visible");
  new Mark(context).unmark();
}

function refreshNbResults(searchTerm) {
  const nbResults = document.querySelector("#nb-results");
  const reset = document.querySelector("#reset");
  const hasSearch = searchTerm != "";

  if (hasSearch || showingFavoritesOnly) {
    const nbPoemes = document.querySelectorAll(
      ".poemes-container .poeme.visible",
    ).length;
    const label = showingFavoritesOnly && !hasSearch ? "favori" : "poème";
    const text = nbPoemes == 1 ? label : label + "s";
    nbResults.textContent = `${nbPoemes} ${text}`;
    hasSearch ? show(reset) : hide(reset);
  } else {
    nbResults.textContent = "";
    hide(reset);
  }
}

function matchesSearchCriteria(poemeDiv, searchTerm, date, id) {
  const textContent = normalize(
    poemeDiv.querySelector(".js-poeme-search").textContent,
  );

  // Recherche vide = tout afficher
  if (searchTerm.trim() == "") return true;

  // Recherche exacte (citation ou hashtag)
  if (searchTerm.startsWith('"') || searchTerm.startsWith("#")) {
    return textContent.includes(searchTerm.replaceAll('"', ""));
  }

  // Recherche par range d'ID : `123-`
  if (searchTerm.match(/^(\d+)-$/)) {
    const matchedId = parseInt(searchTerm.match(/^(\d+)-/)[1]);
    return parseInt(id) >= matchedId;
  }

  // Recherche par range d'ID : `123-130`
  if (searchTerm.match(/^(\d+)-(\d+)$/) && !/^\d{4}-\d{2}$/.test(searchTerm)) {
    const matches = searchTerm.match(/^(\d+)-(\d+)$/);
    const start = parseInt(matches[1]);
    const end = parseInt(matches[2]);
    return parseInt(id) >= start && parseInt(id) <= end;
  }

  // Recherche par date : `2025-10-01-`
  if (date && /^\d{4}-\d{2}-\d{2}-$/.test(searchTerm)) {
    const start = new Date(searchTerm.match(/^(\d{4}-\d{2}-\d{2})-$/)[1]);
    return new Date(date) >= start;
  }

  // Recherche par range de dates : `2025-10-01-2025-10-10`
  if (date && /^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}$/.test(searchTerm)) {
    const matches = searchTerm.match(
      /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/,
    );
    const start = new Date(matches[1]);
    const end = new Date(matches[2]);
    return new Date(date) >= start && new Date(date) <= end;
  }

  // Recherche par mots-clés
  return includesAnyWord(
    textContent,
    searchTerm.split(" ").filter((word) => word != ""),
  );
}

function filterPoemes(searchTerm) {
  // Cacher tous les titres et jours visibles
  document.querySelectorAll(".poeme-titles .poeme-title.visible").forEach(hide);
  document.querySelectorAll(".day.visible").forEach(hide);

  const favorites = getFavorites();
  const isFavoritesMode = showingFavoritesOnly;

  document.querySelectorAll(".poemes-container .poeme").forEach((poemeDiv) => {
    const poemeDate = poemeDiv.querySelector(".poeme-date");
    const date = poemeDate ? poemeDate.textContent.trim() : null;
    const id = poemeDiv.getAttribute("data-id");

    let matches = matchesSearchCriteria(poemeDiv, searchTerm, date, id);

    // Filtrer par favoris si le mode favoris est actif
    if (isFavoritesMode && !favorites.includes(id)) {
      matches = false;
    }

    if (matches) {
      show(poemeDiv);
      const title = document.querySelector(`.poeme-title[data-id="${id}"]`);
      if ((searchTerm != "" || isFavoritesMode) && title) {
        show(title);
      }
      if (date) {
        show(document.querySelector(`.day[data-day="${date}"]`));
      }
    } else {
      hide(poemeDiv);
    }
  });

  refreshNbResults(searchTerm);
  highlightText(searchTerm);
}

function handleAnchorChange() {
  const currentHash = window.location.hash;
  const search = document.getElementById("search");

  if (currentHash) {
    const targetId = currentHash.substring(1);
    const targetDiv = document.querySelector(`div[data-id="${targetId}"]`);
    const searchTerm = decodeURI(currentHash.substring(1));
    if (search) {
      search.value = searchTerm;
    }

    if (targetDiv) {
      document.querySelectorAll(".visible").forEach((div) => hide(div));
      show(targetDiv);
      refreshNbResults(searchTerm);
      highlightText(searchTerm);
    } else {
      filterPoemes(normalize(searchTerm));
    }
  } else {
    filterPoemes("");
  }

  document
    .querySelectorAll(".poeme-title.active")
    .forEach((span) => span.classList.remove("active"));
  hide(document.getElementById("reset-poeme-titles"));
}

function copyContent(container, source, target) {
  const src = container.querySelector(source);
  src.addEventListener("click", function () {
    const toShow = container.querySelectorAll(".to_show");
    toShow.forEach((div) => show(div));

    const content = container
      .querySelector(target)
      .textContent.trim()
      .replace(/( ){10,}/, "\n");
    navigator.clipboard.writeText(content);

    toShow.forEach((div) => hide(div));

    const oldContent = src.innerHTML;
    src.innerHTML = "Copié !";
    setTimeout(() => {
      src.innerHTML = oldContent;
    }, 1_500);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search");
  if (searchInput) {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#")) {
      const searchTerm = decodeURI(hash.substring(1));
      searchInput.value = searchTerm;
    }

    searchInput.addEventListener("input", function () {
      let value = this.value;
      if (this.value.startsWith("#")) {
        value = "#" + value;
      }
      window.location.hash = value;
    });
  }
  document.querySelector("#reset").addEventListener("click", function () {
    searchInput.value = "";
    window.location.hash = "";
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".poeme-container").forEach((container) => {
    copyContent(container, ".js-copy-button", ".poeme-text");
    copyContent(container, ".js-share-button", ".js-share-url");
  });
});

window.addEventListener("hashchange", handleAnchorChange);
document.addEventListener("DOMContentLoaded", handleAnchorChange);

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".js-notes-auteur").forEach(function (div) {
    div.addEventListener("click", () => {
      const target = document.querySelector(".poeme-notes");
      if (target.classList.contains("visible")) {
        hide(target);
      } else {
        show(target);
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".up-down").addEventListener("click", function () {
    const container = document.querySelector(".poemes-container");
    toggleReverse(container);
    toggleReverse(document.querySelector(".poeme-titles"));

    container.querySelectorAll(".poeme-container").forEach((div) => {
      div.classList.add("animate__animated", "animate__fadeInDown");
      div.addEventListener("animationend", () => {
        div.classList.remove("animate__animated", "animate__fadeInDown");
      });
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(`[tabindex="0"]`).forEach((div) => {
    div.addEventListener("keydown", () => {
      if (!document.activeElement === div) {
        return;
      }
      if (["Enter", "Space"].includes(event.code)) {
        event.preventDefault();
        div.click();
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  let poemeDivs = [...document.querySelectorAll(".poeme.visible")];
  let currentPoemeIndex = 0;

  function focusPoemeDiv(index) {
    currentPoemeIndex = index;
    if (poemeDivs[currentPoemeIndex]) {
      poemeDivs[currentPoemeIndex].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      poemeDivs[currentPoemeIndex].classList.add(
        "animate__animated",
        "animate__fadeIn",
      );
      poemeDivs[currentPoemeIndex].addEventListener("animationend", () => {
        poemeDivs[currentPoemeIndex].classList.remove(
          "animate__animated",
          "animate__fadeIn",
        );
      });
    }
  }

  function refreshPoemes() {
    poemeDivs = [...document.querySelectorAll(".poeme.visible")];
    currentPoemeIndex = 0;
  }

  window.addEventListener("hashchange", () => refreshPoemes());
  window.addEventListener("poemes-changed", () => refreshPoemes());

  document
    .querySelector(".up-down")
    .addEventListener("click", () => (poemeDivs = poemeDivs.reverse()));

  document.addEventListener("keydown", (event) => {
    const searchInput = document.getElementById("search");
    if (searchInput == document.activeElement) {
      return;
    }
    if (event.key === "/") {
      searchInput.focus();
      event.preventDefault();
    }
    if (event.key === "t") {
      document.querySelector(".up-down").click();
    }
    if (event.key === "j") {
      focusPoemeDiv((currentPoemeIndex + 1) % poemeDivs.length);
    }
    if (event.key === "k") {
      const nextIndex = currentPoemeIndex - 1;
      if (nextIndex < 0) {
        focusPoemeDiv(poemeDivs.length - 1);
      } else {
        focusPoemeDiv(nextIndex);
      }
    }
    if (event.key === "s") {
      if (poemeDivs[currentPoemeIndex]) {
        const poemeId = poemeDivs[currentPoemeIndex].getAttribute("data-id");
        const button = document.querySelector(
          `.js-favorite-button[data-poeme-id="${poemeId}"]`,
        );
        if (button) {
          button.click();
        }
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  function searchAllPoems() {
    const searchTerm = decodeURI(window.location.hash.substring(1));
    filterPoemes(normalize(searchTerm));
  }

  const poemeTitlesReset = document.getElementById("reset-poeme-titles");

  poemeTitlesReset.addEventListener("click", () => {
    document
      .querySelectorAll(".poeme-titles .poeme-title.active")
      .forEach((title) => {
        title.classList.remove("active");
      });
    const showFavButton = document.getElementById("show-favorites");
    if (showFavButton && showFavButton.classList.contains("active")) {
      // Si le mode favoris est actif, réafficher les favoris
      displayOnlyFavorites();
    } else {
      searchAllPoems();
    }
    hide(poemeTitlesReset);
  });

  document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
    title.addEventListener("click", () => {
      if (title.classList.contains("active")) {
        title.classList.remove("active");
      } else {
        title.classList.add("active");
        show(poemeTitlesReset);
      }
      document
        .querySelectorAll(".poemes-container .poeme")
        .forEach((div) => hide(div));

      const activeTitles = document.querySelectorAll(
        ".poeme-titles .poeme-title.active",
      );
      activeTitles.forEach(function (title) {
        const targetId = title.getAttribute("data-id");
        const poeme = document.querySelector(`.poeme[data-id="${targetId}"]`);
        poeme.classList.add("visible");
      });
      if (activeTitles.length === 0) {
        const showFavButton = document.getElementById("show-favorites");
        if (showFavButton && showFavButton.classList.contains("active")) {
          // Si le mode favoris est actif, réafficher les favoris
          displayOnlyFavorites();
        } else {
          searchAllPoems();
        }
        hide(poemeTitlesReset);
      }
      document.dispatchEvent(new Event("poemes-changed", { bubbles: true }));
    });
  });

  const modal = document.getElementById("modal");
  const close = document.getElementsByClassName("close-btn")[0];

  close.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  document.onkeydown = function (event) {
    if (event.key === "?") {
      modal.style.display = "block";
    }
    if (event.key === "Escape" || event.keyCode === 27) {
      if (modal.style.display === "block") {
        modal.style.display = "none";
      }
    }
  };
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/service-worker.js");
    } catch (err) {
      console.log(err);
    }
  });
}

// Gestion des favoris
const FAVORITES_KEY = "poemes-favorites";
let showingFavoritesOnly = false;

function getFavorites() {
  const favorites = localStorage.getItem(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(poemeId) {
  return getFavorites().includes(poemeId);
}

function toggleFavorite(poemeId) {
  let favorites = getFavorites();
  const index = favorites.indexOf(poemeId);

  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(poemeId);
  }

  saveFavorites(favorites);
  return index === -1;
}

function updateFavoriteButton(button, isFav) {
  button.classList.toggle("is-favorite", isFav);

  // Animation quand on ajoute en favori
  if (isFav) {
    button.classList.add("animate__animated", "animate__heartBeat");
    button.addEventListener(
      "animationend",
      () => {
        button.classList.remove("animate__animated", "animate__heartBeat");
      },
      { once: true },
    );
  }
}

function updateShowFavoritesButton() {
  const showFavButton = document.getElementById("show-favorites");
  const favorites = getFavorites();

  if (favorites.length > 0) {
    showFavButton.classList.remove("hidden");
    const text = favorites.length === 1 ? "favori" : "favoris";
    showFavButton.textContent = `${favorites.length} ${text}`;
  } else {
    showFavButton.classList.add("hidden");
  }
}

function filterByFavorites(favorites) {
  // Collecter les dates des poèmes favoris
  const favoriteDates = new Set();

  document.querySelectorAll(".poemes-container .poeme").forEach((div) => {
    const poemeId = div.getAttribute("data-id");
    const isFavorite = favorites.includes(poemeId);

    if (isFavorite) {
      const poemeDate = div.querySelector(".poeme-date");
      if (poemeDate) {
        const date = poemeDate.textContent.trim();
        favoriteDates.add(date);
      }
    }

    isFavorite ? show(div) : hide(div);
  });

  document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
    const titleId = title.getAttribute("data-id");
    favorites.includes(titleId) ? show(title) : hide(title);
  });

  // Filtrer les jours pour n'afficher que ceux des favoris
  document.querySelectorAll(".day").forEach((day) => {
    const dayDate = day.getAttribute("data-day");
    favoriteDates.has(dayDate) ? show(day) : hide(day);
  });
}

function setFavoritesMode(enabled) {
  const showFavButton = document.getElementById("show-favorites");
  showingFavoritesOnly = enabled;

  if (enabled) {
    showFavButton.style.background = "#ffd700";
    showFavButton.classList.add("active");
  } else {
    showFavButton.style.background = "var(--day-color)";
    showFavButton.classList.remove("active");
  }
}

function updateFavoritesCounter() {
  const favorites = getFavorites();
  const nbResults = document.querySelector("#nb-results");

  if (favorites.length > 0) {
    const text = favorites.length === 1 ? "favori" : "favoris";
    nbResults.textContent = `${favorites.length} ${text}`;
  } else {
    nbResults.textContent = "";
  }
}

function updateDaysForFavorites() {
  const favoriteDates = new Set();

  document
    .querySelectorAll(".poemes-container .poeme.visible")
    .forEach((div) => {
      const poemeDate = div.querySelector(".poeme-date");
      if (poemeDate) {
        favoriteDates.add(poemeDate.textContent.trim());
      }
    });

  document.querySelectorAll(".day").forEach((day) => {
    const dayDate = day.getAttribute("data-day");
    favoriteDates.has(dayDate) ? show(day) : hide(day);
  });
}

function animateRemoveFromFavorites(button) {
  const poemeContainer = button.closest(".poeme-container");
  if (!poemeContainer) return;

  const poemeId = button.getAttribute("data-poeme-id");

  poemeContainer.classList.add("animate__animated", "animate__fadeOut");
  poemeContainer.addEventListener(
    "animationend",
    () => {
      hide(poemeContainer.querySelector(".poeme"));
      poemeContainer.classList.remove("animate__animated", "animate__fadeOut");

      // Cacher le titre du poème
      const poemeTitle = document.querySelector(
        `.poeme-title[data-id="${poemeId}"]`,
      );
      if (poemeTitle) {
        hide(poemeTitle);
      }

      updateFavoritesCounter();
      updateDaysForFavorites();
    },
    { once: true },
  );
}

function displayOnlyFavorites() {
  setFavoritesMode(true);

  const searchInput = document.getElementById("search");
  if (searchInput && searchInput.value) {
    filterPoemes(normalize(searchInput.value));
  } else {
    const favorites = getFavorites();
    filterByFavorites(favorites);
    updateFavoritesCounter();
  }
}

function displayAllPoemes() {
  setFavoritesMode(false);

  document
    .querySelectorAll(".poemes-container .poeme")
    .forEach((div) => show(div));
  document
    .querySelectorAll(".poeme-titles .poeme-title")
    .forEach((title) => hide(title));
  document.querySelectorAll(".day").forEach((day) => show(day));

  const nbResults = document.querySelector("#nb-results");
  nbResults.textContent = "";

  const searchInput = document.getElementById("search");
  if (searchInput && searchInput.value) {
    filterPoemes(normalize(searchInput.value));
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialiser les boutons favoris
  document.querySelectorAll(".js-favorite-button").forEach((button) => {
    const poemeId = button.getAttribute("data-poeme-id");
    const isFav = isFavorite(poemeId);
    updateFavoriteButton(button, isFav);

    button.addEventListener("click", function () {
      const newIsFav = toggleFavorite(poemeId);
      updateFavoriteButton(button, newIsFav);
      updateShowFavoritesButton();

      // Si on retire un favori en mode favoris, l'animer puis le cacher
      if (!newIsFav && showingFavoritesOnly) {
        animateRemoveFromFavorites(button);
      }
    });
  });

  // Afficher le bouton "Favoris" si des favoris existent
  updateShowFavoritesButton();

  // Filtrer pour afficher uniquement les favoris
  const showFavButton = document.getElementById("show-favorites");

  showFavButton.addEventListener("click", function () {
    showingFavoritesOnly ? displayAllPoemes() : displayOnlyFavorites();
  });
});
