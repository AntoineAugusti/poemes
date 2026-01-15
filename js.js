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

  const context = document.querySelectorAll(".poemes-container .poeme.visible");

  // Recherche par couple de rimes : surligner les deux mots
  if (searchTerm.startsWith("rime:")) {
    const parts = searchTerm.split(":");
    if (parts.length === 3) {
      const word1 = parts[1].trim();
      const word2 = parts[2].trim();
      const markInstance = new Mark(context);
      markInstance.mark(word1, {
        accuracy: { value: "exactly", limiters: [".", ","] },
        separateWordSearch: false,
      });
      markInstance.mark(word2, {
        accuracy: { value: "exactly", limiters: [".", ","] },
        separateWordSearch: false,
      });
    }
    return;
  }

  if (searchTerm != normalize(searchTerm)) {
    highlightText(normalize(searchTerm));
  }

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

// Utilitaires pour la recherche de rimes
const RhymeUtils = {
  normalizeWord(word) {
    return normalize(word).replace(/[^\w\s-]/g, "");
  },

  extractLastWords(poemeDiv) {
    const poemeText = poemeDiv.querySelector(".poeme-text");
    if (!poemeText) return [];

    return poemeText.textContent
      .split("\n")
      .filter((v) => v.trim())
      .map((verse) => {
        const words = verse.trim().split(/\s+/);
        if (words.length === 0) return "";

        let lastWord = words[words.length - 1];
        // Gérer les apostrophes : "l'air" -> "air"
        if (lastWord.includes("'")) {
          const parts = lastWord.split("'");
          lastWord = parts[parts.length - 1];
        }

        return this.normalizeWord(lastWord);
      });
  },

  findRhymePair(lastWords, word1, word2) {
    const RHYME_OFFSETS = [1, 2]; // Consécutives (AA) et alternées (ABAB)

    for (let i = 0; i < lastWords.length; i++) {
      const currentWord = lastWords[i];
      if (currentWord !== word1 && currentWord !== word2) continue;

      const searchWord = currentWord === word1 ? word2 : word1;

      for (const offset of RHYME_OFFSETS) {
        if (
          i + offset < lastWords.length &&
          lastWords[i + offset] === searchWord
        ) {
          return true;
        }
      }
    }

    return false;
  },

  searchPair(poemeDiv, word1, word2) {
    const normalizedWord1 = this.normalizeWord(word1);
    const normalizedWord2 = this.normalizeWord(word2);

    const lastWords = this.extractLastWords(poemeDiv);
    return this.findRhymePair(lastWords, normalizedWord1, normalizedWord2);
  },
};

function matchesSearchCriteria(poemeDiv, searchTerm, date, id) {
  const textContent = normalize(
    poemeDiv.querySelector(".js-poeme-search").textContent,
  );

  // Recherche vide = tout afficher
  if (searchTerm.trim() == "") return true;

  // Recherche par couple de rimes : `rime:mot1:mot2`
  if (searchTerm.startsWith("rime:")) {
    const parts = searchTerm.split(":");
    if (parts.length === 3) {
      return RhymeUtils.searchPair(poemeDiv, parts[1].trim(), parts[2].trim());
    }
    return false;
  }

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

// Génération d'image pour un poème
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    bgColor: style.getPropertyValue("--bg-color").trim(),
    panelColor: style.getPropertyValue("--panel-color").trim(),
    fontColor: style.getPropertyValue("--font-color").trim(),
    fontColorMuted: style.getPropertyValue("--font-color-muted").trim(),
    borderColor: style.getPropertyValue("--border-color").trim(),
  };
}

function generatePoemeImage(container) {
  const colors = getThemeColors();
  const poemeContent = container.querySelector(".poeme-content");
  const titleEl = poemeContent.querySelector(".poeme-title");
  const dateEl = poemeContent.querySelector(".poeme-date");
  const textEl = poemeContent.querySelector(".poeme-text");

  const title = titleEl ? titleEl.textContent.trim() : "";
  const date = dateEl ? dateEl.textContent.trim() : "";

  // Convertir les <br> en \n pour respecter les sauts de ligne
  let text = "";
  if (textEl) {
    const clone = textEl.cloneNode(true);
    // Supprimer le div .to_show (titre dupliqué)
    const toShow = clone.querySelector(".to_show");
    if (toShow) toShow.remove();
    // Remplacer les <br> par des marqueurs de saut de ligne
    clone.querySelectorAll("br").forEach((br) => {
      br.replaceWith("\n");
    });
    text = clone.textContent.trim();
  }

  const lines = text.split("\n");

  // Configuration du canvas
  const padding = 60;
  const lineHeight = 20;
  const titleSize = 28;
  const textSize = 24;
  const dateSize = 18;

  // Créer un canvas temporaire pour mesurer le texte
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.font = `${textSize}px Vollkorn, serif`;

  // Calculer la largeur maximale du texte
  let maxTextWidth = 0;
  lines.forEach((line) => {
    const width = tempCtx.measureText(line).width;
    if (width > maxTextWidth) maxTextWidth = width;
  });

  if (title) {
    tempCtx.font = `bold ${titleSize}px Vollkorn, serif`;
    const titleWidth = tempCtx.measureText(title).width;
    if (titleWidth > maxTextWidth) maxTextWidth = titleWidth;
  }

  // Dimensions du canvas
  const canvasWidth = Math.max(500, maxTextWidth + padding * 2);
  const titleHeight = title ? titleSize + 10 : 0;
  const dateHeight = date ? dateSize + 25 : 0;
  const textHeight = lines.length * lineHeight;
  const canvasHeight = padding * 2 + titleHeight + dateHeight + textHeight + 20;

  // Créer le canvas final
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  // Fond
  ctx.fillStyle = colors.bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Panneau du poème
  const panelMargin = 20;
  const panelX = panelMargin;
  const panelY = panelMargin;
  const panelWidth = canvasWidth - panelMargin * 2;
  const panelHeight = canvasHeight - panelMargin * 2;

  ctx.fillStyle = colors.panelColor;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Bordure
  ctx.strokeStyle = colors.borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  let currentY = padding;

  // Titre
  if (title) {
    ctx.font = `bold ${titleSize}px Vollkorn, serif`;
    ctx.fillStyle = colors.fontColor;
    ctx.fillText(title, padding, currentY + titleSize);
    currentY += titleSize + 10;
  }

  // Date
  if (date) {
    ctx.font = `${dateSize}px Vollkorn, serif`;
    ctx.fillStyle = colors.fontColorMuted;
    ctx.fillText(date, padding, currentY + dateSize);
    currentY += dateSize + 25;
  }

  // Texte du poème
  ctx.font = `${textSize}px Vollkorn, serif`;
  ctx.fillStyle = colors.fontColor;
  lines.forEach((line) => {
    currentY += lineHeight;
    ctx.fillText(line, padding, currentY);
  });

  return canvas;
}

function downloadPoemeImage(container) {
  const canvas = generatePoemeImage(container);
  const poemeId = container.querySelector(".poeme").getAttribute("data-id");

  const link = document.createElement("a");
  link.download = `poeme-${poemeId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".js-image-button").forEach((button) => {
    button.addEventListener("click", function () {
      const container = this.closest(".poeme-container");
      downloadPoemeImage(container);

      const oldContent = this.innerHTML;
      this.innerHTML = "Téléchargé !";
      setTimeout(() => {
        this.innerHTML = oldContent;
      }, 1500);
    });
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

// Gestion du mode hors ligne
function updateOfflineStatus() {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;

  if (!navigator.onLine) {
    banner.classList.add("visible");
    document.body.classList.add("is-offline");
  } else {
    banner.classList.remove("visible");
    document.body.classList.remove("is-offline");
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);
document.addEventListener("DOMContentLoaded", updateOfflineStatus);

// Bouton retour en haut (visible uniquement sur mobile)
document.addEventListener("DOMContentLoaded", function () {
  const scrollToTopBtn = document.getElementById("scroll-to-top");
  if (!scrollToTopBtn) return;

  // Afficher/masquer le bouton en fonction du scroll
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.remove("hidden");
    } else {
      scrollToTopBtn.classList.add("hidden");
    }
  });

  // Remonter en haut au clic
  scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});

// Remonter en haut quand on clique sur un thème
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("a.theme").forEach(function (link) {
    link.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  });
});

// Utilitaires pour gérer les hauteurs des jours
const DayHeights = {
  save() {
    document.querySelectorAll(".day").forEach((day) => {
      const originalHeight = day.style.height || "1px";
      day.setAttribute("data-original-height", originalHeight);
    });
  },

  restore() {
    document.querySelectorAll(".day").forEach((day) => {
      const originalHeight = day.getAttribute("data-original-height");
      if (originalHeight) {
        day.style.height = originalHeight;
      }
      show(day);
    });
  },

  updateFromCounts(dateCounts) {
    document.querySelectorAll(".day").forEach((day) => {
      const dayDate = day.getAttribute("data-day");
      if (dateCounts[dayDate]) {
        show(day);
        day.style.height = 15 * dateCounts[dayDate] + "px";
      } else {
        hide(day);
      }
    });
  },
};

// Sauvegarder les hauteurs originales au chargement
document.addEventListener("DOMContentLoaded", () => DayHeights.save());

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

function updateFavoriteTitles() {
  const favorites = getFavorites();

  document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
    const titleId = title.getAttribute("data-id");
    // Ne pas colorer en mode favoris car tous sont des favoris
    if (!showingFavoritesOnly && favorites.includes(titleId)) {
      title.classList.add("favorite");
    } else {
      title.classList.remove("favorite");
    }
  });
}

function updateFavoriteDays() {
  const favorites = getFavorites();

  // Réinitialiser le style de tous les jours
  document.querySelectorAll(".day").forEach((day) => {
    day.style.background = "";
  });

  // Compter les favoris par jour et le total de poèmes par jour
  const favoritesPerDay = {};
  const totalPerDay = {};

  document.querySelectorAll(".poeme").forEach((poeme) => {
    const poemeDate = poeme.querySelector(".poeme-date");
    if (poemeDate) {
      const date = poemeDate.textContent.trim();
      const poemeId = poeme.getAttribute("data-id");

      totalPerDay[date] = (totalPerDay[date] || 0) + 1;
      if (favorites.includes(poemeId)) {
        favoritesPerDay[date] = (favoritesPerDay[date] || 0) + 1;
      }
    }
  });

  // Appliquer un dégradé proportionnel pour chaque jour avec des favoris
  Object.keys(favoritesPerDay).forEach((date) => {
    const day = document.querySelector(`.day[data-day="${date}"]`);
    if (day) {
      const favoriteCount = favoritesPerDay[date];
      const totalCount = totalPerDay[date];
      const percentage = (favoriteCount / totalCount) * 100;

      // En mode favoris, afficher 100% jaune car seuls les favoris sont visibles
      if (showingFavoritesOnly || percentage === 100) {
        day.style.background = "var(--favorite-color)";
      } else {
        day.style.background = `linear-gradient(to top, var(--favorite-color) ${percentage}%, var(--day-color) ${percentage}%)`;
      }
    }
  });
}

function countPoemesByDate(selector) {
  const dateCounts = {};
  document.querySelectorAll(selector).forEach((div) => {
    const poemeDate = div.querySelector(".poeme-date");
    if (poemeDate) {
      const date = poemeDate.textContent.trim();
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    }
  });
  return dateCounts;
}

function filterByFavorites(favorites) {
  // Afficher/cacher les poèmes
  document.querySelectorAll(".poemes-container .poeme").forEach((div) => {
    const poemeId = div.getAttribute("data-id");
    favorites.includes(poemeId) ? show(div) : hide(div);
  });

  // Afficher/cacher les titres
  document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
    const titleId = title.getAttribute("data-id");
    favorites.includes(titleId) ? show(title) : hide(title);
  });

  // Mettre à jour les hauteurs des jours basées sur les favoris visibles
  const dateCounts = countPoemesByDate(".poemes-container .poeme.visible");
  DayHeights.updateFromCounts(dateCounts);
}

function setFavoritesMode(enabled) {
  const showFavButton = document.getElementById("show-favorites");
  showingFavoritesOnly = enabled;

  if (enabled) {
    showFavButton.style.background = "var(--favorite-color)";
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
  const dateCounts = countPoemesByDate(".poemes-container .poeme.visible");
  DayHeights.updateFromCounts(dateCounts);
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
  updateFavoriteDays();
  updateFavoriteTitles();
}

function displayAllPoemes() {
  setFavoritesMode(false);

  document
    .querySelectorAll(".poemes-container .poeme")
    .forEach((div) => show(div));
  document
    .querySelectorAll(".poeme-titles .poeme-title")
    .forEach((title) => hide(title));

  DayHeights.restore();

  const nbResults = document.querySelector("#nb-results");
  nbResults.textContent = "";

  const searchInput = document.getElementById("search");
  if (searchInput && searchInput.value) {
    filterPoemes(normalize(searchInput.value));
  }
  updateFavoriteDays();
  updateFavoriteTitles();
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
      updateFavoriteDays();
      updateFavoriteTitles();

      // Si on retire un favori en mode favoris, l'animer puis le cacher
      if (!newIsFav && showingFavoritesOnly) {
        animateRemoveFromFavorites(button);
      }
    });
  });

  // Afficher le bouton "Favoris" si des favoris existent
  updateShowFavoritesButton();

  // Colorer les jours correspondant aux favoris dans la frise
  updateFavoriteDays();

  // Colorer les titres des poèmes favoris
  updateFavoriteTitles();

  // Filtrer pour afficher uniquement les favoris
  const showFavButton = document.getElementById("show-favorites");

  showFavButton.addEventListener("click", function () {
    showingFavoritesOnly ? displayAllPoemes() : displayOnlyFavorites();
  });
});
