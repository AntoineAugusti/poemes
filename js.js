/*global Mark*/

// =============================================================================
// UTILITAIRES
// =============================================================================

const Utils = {
  normalize(value) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },

  hide(div) {
    div.classList.remove("visible");
    div.classList.add("hidden");
  },

  show(div) {
    div.classList.remove("hidden");
    div.classList.add("visible");
  },

  toggleReverse(div) {
    div.classList.toggle("reverse");
  },

  includesAnyWord(text, words) {
    return words.some((word) => text.includes(word));
  },

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  },
};

// =============================================================================
// GESTION DES HAUTEURS DES JOURS
// =============================================================================

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
      Utils.show(day);
    });
  },

  updateFromCounts(dateCounts) {
    document.querySelectorAll(".day").forEach((day) => {
      const dayDate = day.getAttribute("data-day");
      if (dateCounts[dayDate]) {
        Utils.show(day);
        day.style.height = 15 * dateCounts[dayDate] + "px";
      } else {
        Utils.hide(day);
      }
    });
  },
};

// =============================================================================
// RECHERCHE DE RIMES
// =============================================================================

const RhymeUtils = {
  normalizeWord(word) {
    return Utils.normalize(word).replace(/[^\w\s-]/g, "");
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
        if (lastWord.includes("'")) {
          const parts = lastWord.split("'");
          lastWord = parts[parts.length - 1];
        }

        return this.normalizeWord(lastWord);
      });
  },

  findRhymePair(lastWords, word1, word2) {
    const RHYME_OFFSETS = [1, 2];

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

// =============================================================================
// RECHERCHE ET FILTRAGE
// =============================================================================

const SearchManager = {
  highlightText(searchTerm) {
    this.removeHighlight();

    if (!searchTerm.trim()) return;

    const context = document.querySelectorAll(
      ".poemes-container .poeme.visible",
    );

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

    if (searchTerm != Utils.normalize(searchTerm)) {
      this.highlightText(Utils.normalize(searchTerm));
    }

    let separateWordSearch = true;
    if (searchTerm.startsWith('"') || searchTerm.startsWith("#")) {
      separateWordSearch = false;
    }

    new Mark(context).mark(searchTerm.replaceAll('"', "").replaceAll("#", ""), {
      separateWordSearch: separateWordSearch,
    });
  },

  removeHighlight() {
    const context = document.querySelectorAll(
      ".poemes-container .poeme.visible",
    );
    new Mark(context).unmark();
  },

  refreshNbResults(searchTerm) {
    const nbResults = document.querySelector("#nb-results");
    const reset = document.querySelector("#reset");
    const hasSearch = searchTerm != "";

    if (hasSearch || FavoritesManager.showingFavoritesOnly) {
      const nbPoemes = document.querySelectorAll(
        ".poemes-container .poeme.visible",
      ).length;
      const label =
        FavoritesManager.showingFavoritesOnly && !hasSearch
          ? "favori"
          : "poème";
      const text = nbPoemes == 1 ? label : label + "s";
      nbResults.textContent = `${nbPoemes} ${text}`;
      hasSearch ? Utils.show(reset) : Utils.hide(reset);
    } else {
      nbResults.textContent = "";
      Utils.hide(reset);
    }
  },

  matchesSearchCriteria(poemeDiv, searchTerm, date, id) {
    const textContent = Utils.normalize(
      poemeDiv.querySelector(".js-poeme-search").textContent,
    );

    if (searchTerm.trim() == "") return true;

    if (searchTerm.startsWith("rime:")) {
      const parts = searchTerm.split(":");
      if (parts.length === 3) {
        return RhymeUtils.searchPair(
          poemeDiv,
          parts[1].trim(),
          parts[2].trim(),
        );
      }
      return false;
    }

    if (searchTerm.startsWith('"') || searchTerm.startsWith("#")) {
      return textContent.includes(searchTerm.replaceAll('"', ""));
    }

    if (searchTerm.match(/^(\d+)-$/)) {
      const matchedId = parseInt(searchTerm.match(/^(\d+)-/)[1]);
      return parseInt(id) >= matchedId;
    }

    if (
      searchTerm.match(/^(\d+)-(\d+)$/) &&
      !/^\d{4}-\d{2}$/.test(searchTerm)
    ) {
      const matches = searchTerm.match(/^(\d+)-(\d+)$/);
      const start = parseInt(matches[1]);
      const end = parseInt(matches[2]);
      return parseInt(id) >= start && parseInt(id) <= end;
    }

    if (date && /^\d{4}-\d{2}-\d{2}-$/.test(searchTerm)) {
      const start = new Date(searchTerm.match(/^(\d{4}-\d{2}-\d{2})-$/)[1]);
      return new Date(date) >= start;
    }

    if (date && /^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}$/.test(searchTerm)) {
      const matches = searchTerm.match(
        /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/,
      );
      const start = new Date(matches[1]);
      const end = new Date(matches[2]);
      return new Date(date) >= start && new Date(date) <= end;
    }

    return Utils.includesAnyWord(
      textContent,
      searchTerm.split(" ").filter((word) => word != ""),
    );
  },

  filterPoemes(searchTerm) {
    document
      .querySelectorAll(".poeme-titles .poeme-title.visible")
      .forEach(Utils.hide);
    document.querySelectorAll(".day.visible").forEach(Utils.hide);

    const favorites = FavoritesManager.getFavorites();
    const isFavoritesMode = FavoritesManager.showingFavoritesOnly;

    document
      .querySelectorAll(".poemes-container .poeme")
      .forEach((poemeDiv) => {
        const poemeDate = poemeDiv.querySelector(".poeme-date");
        const date = poemeDate ? poemeDate.textContent.trim() : null;
        const id = poemeDiv.getAttribute("data-id");

        let matches = this.matchesSearchCriteria(
          poemeDiv,
          searchTerm,
          date,
          id,
        );

        if (isFavoritesMode && !favorites.includes(id)) {
          matches = false;
        }

        if (matches) {
          Utils.show(poemeDiv);
          const title = document.querySelector(`.poeme-title[data-id="${id}"]`);
          if ((searchTerm != "" || isFavoritesMode) && title) {
            Utils.show(title);
          }
          if (date) {
            Utils.show(document.querySelector(`.day[data-day="${date}"]`));
          }
        } else {
          Utils.hide(poemeDiv);
        }
      });

    this.refreshNbResults(searchTerm);
    this.highlightText(searchTerm);
  },

  handleAnchorChange() {
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
        document.querySelectorAll(".visible").forEach((div) => Utils.hide(div));
        Utils.show(targetDiv);
        const poemeDate = targetDiv.querySelector(".poeme-date");
        if (poemeDate) {
          const date = poemeDate.textContent.trim();
          const dayEl = document.querySelector(`.day[data-day="${date}"]`);
          if (dayEl) {
            Utils.show(dayEl);
          }
        }
        this.refreshNbResults(searchTerm);
        this.highlightText(searchTerm);
      } else {
        this.filterPoemes(Utils.normalize(searchTerm));
      }
    } else {
      this.filterPoemes("");
    }

    document
      .querySelectorAll(".poeme-title.active")
      .forEach((span) => span.classList.remove("active"));
    Utils.hide(document.getElementById("reset-poeme-titles"));
  },

  searchAllPoems() {
    const searchTerm = decodeURI(window.location.hash.substring(1));
    this.filterPoemes(Utils.normalize(searchTerm));
  },

  init() {
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

    document.querySelector("#reset").addEventListener("click", () => {
      searchInput.value = "";
      window.location.hash = "";
    });

    window.addEventListener("hashchange", () => this.handleAnchorChange());
    this.handleAnchorChange();
  },
};

// =============================================================================
// GÉNÉRATION D'IMAGES
// =============================================================================

const ImageGenerator = {
  currentPoemeContainer: null,
  currentCanvas: null,

  colors: [
    [102, 126, 234],
    [118, 75, 162],
    [240, 147, 251],
    [255, 123, 84],
    [100, 200, 255],
    [240, 192, 64],
    [64, 224, 208],
    [255, 107, 107],
    [78, 205, 196],
    [199, 128, 232],
    [250, 211, 144],
    [248, 194, 145],
    [246, 185, 59],
    [235, 47, 6],
    [250, 152, 58],
    [229, 142, 38],
    [183, 21, 64],
    [12, 36, 97],
    [30, 55, 153],
    [74, 105, 189],
    [106, 137, 204],
    [130, 204, 221],
    [96, 163, 188],
    [60, 99, 130],
    [10, 61, 98],
    [184, 233, 148],
    [120, 224, 143],
    [56, 173, 169],
    [7, 153, 146],
  ],

  baseColors: [
    ["#1a1a2e", "#16213e"],
    ["#0f0f1a", "#1a1a2e"],
    ["#1f1f3d", "#2d2d5a"],
    ["#0d1b2a", "#1b263b"],
  ],

  randomColor(alpha = 1) {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  },

  drawRandomGradients(ctx, width, height) {
    const baseColor =
      this.baseColors[Math.floor(Math.random() * this.baseColors.length)];
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, baseColor[0]);
    baseGradient.addColorStop(0.5, baseColor[1]);
    baseGradient.addColorStop(1, baseColor[0]);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Couche de brume avec mode de fusion
    ctx.globalCompositeOperation = "screen";
    const numBlurs = Math.floor(Utils.randomBetween(2, 4));
    for (let i = 0; i < numBlurs; i++) {
      const x = Utils.randomBetween(0, width);
      const y = Utils.randomBetween(0, height);
      const radius = Utils.randomBetween(width * 0.5, width * 1.2);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(
        0,
        this.randomColor(Utils.randomBetween(0.08, 0.15)),
      );
      gradient.addColorStop(
        0.5,
        this.randomColor(Utils.randomBetween(0.03, 0.08)),
      );
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Cercles colorés avec transitions plus douces
    ctx.globalCompositeOperation = "soft-light";
    const numCircles = Math.floor(Utils.randomBetween(4, 7));
    for (let i = 0; i < numCircles; i++) {
      const x = Utils.randomBetween(0, width);
      const y = Utils.randomBetween(0, height);
      const radius = Utils.randomBetween(width * 0.2, width * 0.8);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const color1 = this.randomColor(Utils.randomBetween(0.4, 0.7));
      const color2 = this.randomColor(Utils.randomBetween(0.2, 0.4));
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.3, color1);
      gradient.addColorStop(0.6, color2);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Lignes colorées
    ctx.globalCompositeOperation = "overlay";
    const numLines = Math.floor(Utils.randomBetween(2, 4));
    for (let i = 0; i < numLines; i++) {
      const x1 = Utils.randomBetween(-width * 0.2, width * 1.2);
      const y1 = Utils.randomBetween(-height * 0.2, height * 1.2);
      const angle = Utils.randomBetween(0, Math.PI * 2);
      const length = Utils.randomBetween(width * 0.5, width * 1.5);
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(
        0.2,
        this.randomColor(Utils.randomBetween(0.3, 0.5)),
      );
      gradient.addColorStop(
        0.5,
        this.randomColor(Utils.randomBetween(0.4, 0.6)),
      );
      gradient.addColorStop(
        0.8,
        this.randomColor(Utils.randomBetween(0.3, 0.5)),
      );
      gradient.addColorStop(1, "transparent");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Utils.randomBetween(30, 100);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Points lumineux subtils
    ctx.globalCompositeOperation = "screen";
    const numGlows = Math.floor(Utils.randomBetween(3, 6));
    for (let i = 0; i < numGlows; i++) {
      const x = Utils.randomBetween(0, width);
      const y = Utils.randomBetween(0, height);
      const radius = Utils.randomBetween(width * 0.05, width * 0.15);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, this.randomColor(Utils.randomBetween(0.2, 0.4)));
      gradient.addColorStop(
        0.5,
        this.randomColor(Utils.randomBetween(0.05, 0.15)),
      );
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = "source-over";
  },

  generatePoemeImage(container) {
    const poemeContent = container.querySelector(".poeme-content");
    const titleEl = poemeContent.querySelector(".poeme-title");
    const dateEl = poemeContent.querySelector(".poeme-date");
    const textEl = poemeContent.querySelector(".poeme-text");

    const title = titleEl ? titleEl.textContent.trim() : "";
    const date = dateEl ? dateEl.textContent.trim() : "";

    let text = "";
    if (textEl) {
      const clone = textEl.cloneNode(true);
      const toShow = clone.querySelector(".to_show");
      if (toShow) toShow.remove();
      clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
      text = clone.textContent.trim();
    }

    const lines = text.split("\n");

    const lineHeight = 15;
    const titleSize = 30;
    const textSize = 22;
    const dateSize = 16;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = `${textSize}px Vollkorn, serif`;

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

    const panelPadding = 40;
    const highlightPaddingY = 8;
    const scale = 3;
    const canvasWidth = Math.max(500, maxTextWidth + panelPadding * 2);
    const titleHeight = title ? titleSize + highlightPaddingY + 10 : 0;
    const dateHeight = date ? dateSize + highlightPaddingY + 20 : 0;
    const textHeight = lines.length * (lineHeight + highlightPaddingY * 0.25);
    const canvasHeight =
      panelPadding * 2 +
      titleHeight +
      dateHeight +
      textHeight +
      highlightPaddingY;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    this.drawRandomGradients(ctx, canvasWidth, canvasHeight);

    let currentY = panelPadding;
    const highlightPaddingX = 8;

    if (title) {
      ctx.font = `bold ${titleSize}px Vollkorn, serif`;
      const titleWidth = ctx.measureText(title).width;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(
        panelPadding - highlightPaddingX,
        currentY - highlightPaddingY,
        titleWidth + highlightPaddingX * 2,
        titleSize + highlightPaddingY * 2,
        4,
      );
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.fillText(title, panelPadding, currentY + titleSize - 4);
      currentY += titleSize + highlightPaddingY + 10;
    }

    if (date) {
      ctx.font = `${dateSize}px Vollkorn, serif`;
      const dateWidth = ctx.measureText(date).width;
      const datePaddingX = 5;
      const datePaddingY = 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(
        panelPadding - datePaddingX,
        currentY - datePaddingY,
        dateWidth + datePaddingX * 2,
        dateSize + datePaddingY * 2,
        3,
      );
      ctx.fill();
      ctx.fillStyle = "#555555";
      ctx.fillText(date, panelPadding, currentY + dateSize - 4);
      currentY += dateSize + datePaddingY + 20;
    }

    ctx.font = `${textSize}px Vollkorn, serif`;

    let highlightY = currentY;
    lines.forEach((line) => {
      if (line.trim()) {
        const lineWidth = ctx.measureText(line).width;
        const rectX = panelPadding - highlightPaddingX;
        const rectY = highlightY - highlightPaddingY;
        const rectW = lineWidth + highlightPaddingX * 2;
        const rectH = lineHeight + highlightPaddingY * 2;

        const angle = (Math.random() - 0.5) * 1.6 * (Math.PI / 180);
        const centerX = rectX + rectW / 2;
        const centerY = rectY + rectH / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(-rectW / 2, -rectH / 2, rectW, rectH, 4);
        ctx.fill();
        ctx.restore();
      }
      highlightY += lineHeight + highlightPaddingY * 0.25;
    });

    lines.forEach((line) => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillText(line, panelPadding, currentY + lineHeight);
      currentY += lineHeight + highlightPaddingY * 0.25;
    });

    return canvas;
  },

  createModal() {
    const modal = document.createElement("div");
    modal.id = "image-preview-modal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 90%; width: auto;">
        <span class="close-btn" id="close-image-preview">&times;</span>
        <div id="image-preview-container" style="text-align: center; margin: 1em 0;"></div>
        <div style="text-align: center; margin-top: 1em;">
          <button id="regenerate-image" class="action-button" style="font-size: 1em; padding: 0.5em 1em; margin-right: 0.5em; color: var(--font-color)">
            Régénérer
          </button>
          <button id="download-image" class="action-button" style="font-size: 1em; padding: 0.5em 1em; cursor: pointer; background: var(--accent-color); color: var(--font-color-on-accent);">
            Télécharger
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  },

  showPreview(container) {
    this.currentPoemeContainer = container;
    let modal = document.getElementById("image-preview-modal");
    if (!modal) {
      modal = this.createModal();
    }

    this.regeneratePreview();
    modal.style.display = "block";
  },

  regeneratePreview() {
    if (!this.currentPoemeContainer) return;

    this.currentCanvas = this.generatePoemeImage(this.currentPoemeContainer);
    const previewContainer = document.getElementById("image-preview-container");
    previewContainer.innerHTML = "";

    const img = document.createElement("img");
    img.src = this.currentCanvas.toDataURL("image/png");
    img.style.maxWidth = "100%";
    img.style.maxHeight = "60vh";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
    previewContainer.appendChild(img);
  },

  downloadCurrentImage() {
    if (!this.currentCanvas || !this.currentPoemeContainer) return;

    const poemeId = this.currentPoemeContainer
      .querySelector(".poeme")
      .getAttribute("data-id");
    const link = document.createElement("a");
    link.download = `poeme-${poemeId}.png`;
    link.href = this.currentCanvas.toDataURL("image/png");
    link.click();

    document.getElementById("image-preview-modal").style.display = "none";
  },

  init() {
    document.querySelectorAll(".js-image-button").forEach((button) => {
      button.addEventListener("click", () => {
        const container = button.closest(".poeme-container");
        this.showPreview(container);
      });
    });

    document.addEventListener("click", (e) => {
      if (
        e.target.id === "close-image-preview" ||
        e.target.id === "image-preview-modal"
      ) {
        document.getElementById("image-preview-modal").style.display = "none";
      }
      if (e.target.id === "regenerate-image") {
        this.regeneratePreview();
      }
      if (e.target.id === "download-image") {
        this.downloadCurrentImage();
      }
    });
  },
};

// =============================================================================
// GESTION DES FAVORIS
// =============================================================================

const FavoritesManager = {
  FAVORITES_KEY: "poemes-favorites",
  showingFavoritesOnly: false,
  API_URL:
    window.location.hostname === "localhost" ? "http://localhost:3000" : "/api",

  getFavoritesFromLocalStorage() {
    const favorites = localStorage.getItem(this.FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  },

  saveFavoritesToLocalStorage(favorites) {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
  },

  async loadFavoritesFromAPI() {
    try {
      const response = await fetch(`${this.API_URL}/favorites`, {
        credentials: "include",
      });
      if (response.ok) {
        const favorites = await response.json();
        if (favorites.length > 0) {
          this.saveFavoritesToLocalStorage(favorites);
          return favorites;
        }
      }
    } catch {
      // Ignore les erreurs réseau
    }
    return this.getFavoritesFromLocalStorage();
  },

  async saveFavoritesToAPI(favorites) {
    try {
      await fetch(`${this.API_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ favorites }),
      });
    } catch {
      // Ignore les erreurs réseau
    }
  },

  getFavorites() {
    return this.getFavoritesFromLocalStorage();
  },

  saveFavorites(favorites) {
    this.saveFavoritesToLocalStorage(favorites);
    this.saveFavoritesToAPI(favorites);
  },

  isFavorite(poemeId) {
    return this.getFavorites().includes(poemeId);
  },

  toggleFavorite(poemeId) {
    let favorites = this.getFavorites();
    const index = favorites.indexOf(poemeId);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(poemeId);
    }

    this.saveFavorites(favorites);
    return index === -1;
  },

  updateFavoriteButton(button, isFav) {
    button.classList.toggle("is-favorite", isFav);

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
  },

  updateShowFavoritesButton() {
    const showFavButton = document.getElementById("show-favorites");
    const favorites = this.getFavorites();

    if (favorites.length > 0) {
      showFavButton.classList.remove("hidden");
      const text = favorites.length === 1 ? "favori" : "favoris";
      showFavButton.textContent = `${favorites.length} ${text}`;
    } else {
      showFavButton.classList.add("hidden");
    }
  },

  updateFavoriteTitles() {
    const favorites = this.getFavorites();

    document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
      const titleId = title.getAttribute("data-id");
      if (!this.showingFavoritesOnly && favorites.includes(titleId)) {
        title.classList.add("favorite");
      } else {
        title.classList.remove("favorite");
      }
    });
  },

  updateFavoriteDays() {
    const favorites = this.getFavorites();

    document.querySelectorAll(".day").forEach((day) => {
      day.style.background = "";
    });

    const favoritesPerDay = {};
    const maskedPerDay = {};
    const totalPerDay = {};

    document.querySelectorAll(".poeme").forEach((poeme) => {
      const poemeDate = poeme.querySelector(".poeme-date");
      if (poemeDate) {
        const date = poemeDate.textContent.trim();
        const poemeId = poeme.getAttribute("data-id");
        const isMasked = poeme
          .closest(".poeme-container")
          ?.classList.contains("poeme-masque");

        totalPerDay[date] = (totalPerDay[date] || 0) + 1;

        if (isMasked && !this.showingFavoritesOnly) {
          maskedPerDay[date] = (maskedPerDay[date] || 0) + 1;
        } else if (favorites.includes(poemeId)) {
          favoritesPerDay[date] = (favoritesPerDay[date] || 0) + 1;
        }
      }
    });

    const allDates = new Set([
      ...Object.keys(favoritesPerDay),
      ...Object.keys(maskedPerDay),
    ]);

    allDates.forEach((date) => {
      const day = document.querySelector(`.day[data-day="${date}"]`);
      if (day) {
        const totalCount = totalPerDay[date] || 0;
        const maskedCount = maskedPerDay[date] || 0;
        const favoriteCount = favoritesPerDay[date] || 0;

        const maskedPct = (maskedCount / totalCount) * 100;
        const favoritePct = (favoriteCount / totalCount) * 100;

        if (maskedCount > 0 && favoriteCount > 0) {
          day.style.background = `linear-gradient(to top, var(--masked-color) ${maskedPct}%, var(--favorite-color) ${maskedPct}%, var(--favorite-color) ${maskedPct + favoritePct}%, var(--day-color) ${maskedPct + favoritePct}%)`;
        } else if (maskedCount > 0) {
          if (maskedPct === 100) {
            day.style.background = "var(--masked-color)";
          } else {
            day.style.background = `linear-gradient(to top, var(--masked-color) ${maskedPct}%, var(--day-color) ${maskedPct}%)`;
          }
        } else if (favoriteCount > 0) {
          if (this.showingFavoritesOnly || favoritePct === 100) {
            day.style.background = "var(--favorite-color)";
          } else {
            day.style.background = `linear-gradient(to top, var(--favorite-color) ${favoritePct}%, var(--day-color) ${favoritePct}%)`;
          }
        }
      }
    });
  },

  countPoemesByDate(selector) {
    const dateCounts = {};
    document.querySelectorAll(selector).forEach((div) => {
      const poemeDate = div.querySelector(".poeme-date");
      if (poemeDate) {
        const date = poemeDate.textContent.trim();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });
    return dateCounts;
  },

  filterByFavorites(favorites) {
    document.querySelectorAll(".poemes-container .poeme").forEach((div) => {
      const poemeId = div.getAttribute("data-id");
      favorites.includes(poemeId) ? Utils.show(div) : Utils.hide(div);
    });

    document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
      const titleId = title.getAttribute("data-id");
      favorites.includes(titleId) ? Utils.show(title) : Utils.hide(title);
    });

    const dateCounts = this.countPoemesByDate(
      ".poemes-container .poeme.visible",
    );
    DayHeights.updateFromCounts(dateCounts);
  },

  setFavoritesMode(enabled) {
    const showFavButton = document.getElementById("show-favorites");
    this.showingFavoritesOnly = enabled;

    if (enabled) {
      showFavButton.style.background = "var(--favorite-color)";
      showFavButton.classList.add("active");
    } else {
      showFavButton.style.background = "var(--day-color)";
      showFavButton.classList.remove("active");
    }
  },

  updateFavoritesCounter() {
    const favorites = this.getFavorites();
    const nbResults = document.querySelector("#nb-results");

    if (favorites.length > 0) {
      const text = favorites.length === 1 ? "favori" : "favoris";
      nbResults.textContent = `${favorites.length} ${text}`;
    } else {
      nbResults.textContent = "";
    }
  },

  updateDaysForFavorites() {
    const dateCounts = this.countPoemesByDate(
      ".poemes-container .poeme.visible",
    );
    DayHeights.updateFromCounts(dateCounts);
  },

  animateRemoveFromFavorites(button) {
    const poemeContainer = button.closest(".poeme-container");
    if (!poemeContainer) return;

    const poemeId = button.getAttribute("data-poeme-id");

    poemeContainer.classList.add("animate__animated", "animate__fadeOut");
    poemeContainer.addEventListener(
      "animationend",
      () => {
        Utils.hide(poemeContainer.querySelector(".poeme"));
        poemeContainer.classList.remove(
          "animate__animated",
          "animate__fadeOut",
        );

        const poemeTitle = document.querySelector(
          `.poeme-title[data-id="${poemeId}"]`,
        );
        if (poemeTitle) {
          Utils.hide(poemeTitle);
        }

        this.updateFavoritesCounter();
        this.updateDaysForFavorites();
        this.updateShowFavoritesButton();
      },
      { once: true },
    );
  },

  displayOnlyFavorites() {
    this.setFavoritesMode(true);

    const searchInput = document.getElementById("search");
    if (searchInput && searchInput.value) {
      SearchManager.filterPoemes(Utils.normalize(searchInput.value));
    } else {
      const favorites = this.getFavorites();
      this.filterByFavorites(favorites);
      this.updateFavoritesCounter();
    }
    this.updateFavoriteDays();
    this.updateFavoriteTitles();
  },

  displayAllPoemes() {
    this.setFavoritesMode(false);

    document
      .querySelectorAll(".poemes-container .poeme")
      .forEach((div) => Utils.show(div));
    document
      .querySelectorAll(".poeme-titles .poeme-title")
      .forEach((title) => Utils.hide(title));

    DayHeights.restore();

    const nbResults = document.querySelector("#nb-results");
    nbResults.textContent = "";

    const searchInput = document.getElementById("search");
    if (searchInput && searchInput.value) {
      SearchManager.filterPoemes(Utils.normalize(searchInput.value));
    }
    this.updateFavoriteDays();
    this.updateFavoriteTitles();
  },

  async init() {
    await this.loadFavoritesFromAPI();

    document.querySelectorAll(".js-favorite-button").forEach((button) => {
      const poemeId = button.getAttribute("data-poeme-id");
      const isFav = this.isFavorite(poemeId);
      this.updateFavoriteButton(button, isFav);

      button.addEventListener("click", () => {
        const newIsFav = this.toggleFavorite(poemeId);
        this.updateFavoriteButton(button, newIsFav);
        this.updateShowFavoritesButton();
        this.updateFavoriteDays();
        this.updateFavoriteTitles();
        this.updateDaysForFavorites();

        if (!newIsFav && this.showingFavoritesOnly) {
          this.animateRemoveFromFavorites(button);
        }
      });
    });

    this.updateShowFavoritesButton();
    this.updateFavoriteDays();
    this.updateFavoriteTitles();

    const showFavButton = document.getElementById("show-favorites");
    showFavButton.addEventListener("click", () => {
      this.showingFavoritesOnly
        ? this.displayAllPoemes()
        : this.displayOnlyFavorites();
    });
  },
};

// =============================================================================
// NAVIGATION CLAVIER
// =============================================================================

const KeyboardNavigation = {
  poemeDivs: [],
  currentPoemeIndex: 0,

  focusPoemeDiv(index) {
    this.currentPoemeIndex = index;
    if (this.poemeDivs[this.currentPoemeIndex]) {
      this.poemeDivs[this.currentPoemeIndex].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      this.poemeDivs[this.currentPoemeIndex].classList.add(
        "animate__animated",
        "animate__fadeIn",
      );
      this.poemeDivs[this.currentPoemeIndex].addEventListener(
        "animationend",
        () => {
          this.poemeDivs[this.currentPoemeIndex].classList.remove(
            "animate__animated",
            "animate__fadeIn",
          );
        },
      );
    }
  },

  refreshPoemes() {
    this.poemeDivs = [...document.querySelectorAll(".poeme.visible")];
    this.currentPoemeIndex = 0;
  },

  init() {
    this.poemeDivs = [...document.querySelectorAll(".poeme.visible")];

    window.addEventListener("hashchange", () => this.refreshPoemes());
    window.addEventListener("poemes-changed", () => this.refreshPoemes());

    document
      .querySelector(".up-down")
      .addEventListener(
        "click",
        () => (this.poemeDivs = this.poemeDivs.reverse()),
      );

    document.addEventListener("keydown", (event) => {
      const searchInput = document.getElementById("search");
      if (searchInput == document.activeElement) return;

      switch (event.key) {
        case "/":
          searchInput.focus();
          event.preventDefault();
          break;
        case "t":
          document.querySelector(".up-down").click();
          break;
        case "j":
          this.focusPoemeDiv(
            (this.currentPoemeIndex + 1) % this.poemeDivs.length,
          );
          break;
        case "k": {
          const nextIndex = this.currentPoemeIndex - 1;
          this.focusPoemeDiv(
            nextIndex < 0 ? this.poemeDivs.length - 1 : nextIndex,
          );
          break;
        }
        case "s":
          if (this.poemeDivs[this.currentPoemeIndex]) {
            const poemeId =
              this.poemeDivs[this.currentPoemeIndex].getAttribute("data-id");
            const button = document.querySelector(
              `.js-favorite-button[data-poeme-id="${poemeId}"]`,
            );
            if (button) button.click();
          }
          break;
      }
    });
  },
};

// =============================================================================
// UI MANAGER
// =============================================================================

const UIManager = {
  copyContent(container, source, target) {
    const src = container.querySelector(source);
    src.addEventListener("click", function () {
      const toShow = container.querySelectorAll(".to_show");
      toShow.forEach((div) => Utils.show(div));

      const content = container
        .querySelector(target)
        .textContent.trim()
        .replace(/( ){10,}/, "\n");
      navigator.clipboard.writeText(content);

      toShow.forEach((div) => Utils.hide(div));

      const oldContent = src.innerHTML;
      src.innerHTML = "Copié !";
      setTimeout(() => {
        src.innerHTML = oldContent;
      }, 1_500);
    });
  },

  initCopyButtons() {
    document.querySelectorAll(".poeme-container").forEach((container) => {
      this.copyContent(container, ".js-copy-button", ".poeme-text");
      this.copyContent(container, ".js-share-button", ".js-share-url");
    });
  },

  initNotesAuteur() {
    document.querySelectorAll(".js-notes-auteur").forEach((div) => {
      div.addEventListener("click", () => {
        const target = document.querySelector(".poeme-notes");
        target.classList.contains("visible")
          ? Utils.hide(target)
          : Utils.show(target);
      });
    });
  },

  initUpDown() {
    document.querySelector(".up-down").addEventListener("click", () => {
      const container = document.querySelector(".poemes-container");
      Utils.toggleReverse(container);
      Utils.toggleReverse(document.querySelector(".poeme-titles"));

      container.querySelectorAll(".poeme-container").forEach((div) => {
        div.classList.add("animate__animated", "animate__fadeInDown");
        div.addEventListener("animationend", () => {
          div.classList.remove("animate__animated", "animate__fadeInDown");
        });
      });
    });
  },

  initTabindexHandlers() {
    document.querySelectorAll(`[tabindex="0"]`).forEach((div) => {
      div.addEventListener("keydown", (event) => {
        if (!document.activeElement === div) return;
        if (["Enter", "Space"].includes(event.code)) {
          event.preventDefault();
          div.click();
        }
      });
    });
  },

  initPoemeTitles() {
    const poemeTitlesReset = document.getElementById("reset-poeme-titles");

    poemeTitlesReset.addEventListener("click", () => {
      document
        .querySelectorAll(".poeme-titles .poeme-title.active")
        .forEach((title) => title.classList.remove("active"));
      const showFavButton = document.getElementById("show-favorites");
      if (showFavButton && showFavButton.classList.contains("active")) {
        FavoritesManager.displayOnlyFavorites();
      } else {
        SearchManager.searchAllPoems();
      }
      Utils.hide(poemeTitlesReset);
    });

    document.querySelectorAll(".poeme-titles .poeme-title").forEach((title) => {
      title.addEventListener("click", () => {
        title.classList.toggle("active");
        if (title.classList.contains("active")) {
          Utils.show(poemeTitlesReset);
        }

        document
          .querySelectorAll(".poemes-container .poeme")
          .forEach((div) => Utils.hide(div));

        const activeTitles = document.querySelectorAll(
          ".poeme-titles .poeme-title.active",
        );
        activeTitles.forEach((title) => {
          const targetId = title.getAttribute("data-id");
          const poeme = document.querySelector(`.poeme[data-id="${targetId}"]`);
          poeme.classList.add("visible");
        });

        if (activeTitles.length === 0) {
          const showFavButton = document.getElementById("show-favorites");
          if (showFavButton && showFavButton.classList.contains("active")) {
            FavoritesManager.displayOnlyFavorites();
          } else {
            SearchManager.searchAllPoems();
          }
          Utils.hide(poemeTitlesReset);
        }
        document.dispatchEvent(new Event("poemes-changed", { bubbles: true }));

        document
          .querySelector(".poemes-container")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  },

  initHelpModal() {
    const modal = document.getElementById("modal");
    const close = document.getElementsByClassName("close-btn")[0];

    close.onclick = () => (modal.style.display = "none");

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    document.onkeydown = (event) => {
      if (event.key === "?") {
        modal.style.display = "block";
      }
      if (event.key === "Escape" || event.keyCode === 27) {
        if (modal.style.display === "block") {
          modal.style.display = "none";
        }
      }
    };
  },

  initScrollToTop() {
    const scrollToTopBtn = document.getElementById("scroll-to-top");
    if (!scrollToTopBtn) return;

    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.remove("hidden");
      } else {
        scrollToTopBtn.classList.add("hidden");
      }
    });

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  initThemeLinks() {
    document.querySelectorAll("a.theme").forEach((link) => {
      link.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  },

  initMaskedTitles() {
    document
      .querySelectorAll(".poeme-container.poeme-masque")
      .forEach((container) => {
        const poemeId = container
          .querySelector(".poeme")
          ?.getAttribute("data-id");
        if (poemeId) {
          const title = document.querySelector(
            `.poeme-titles .poeme-title[data-id="${poemeId}"]`,
          );
          if (title) {
            title.classList.add("masked");
          }
        }
      });
  },

  init() {
    this.initCopyButtons();
    this.initNotesAuteur();
    this.initUpDown();
    this.initTabindexHandlers();
    this.initPoemeTitles();
    this.initHelpModal();
    this.initScrollToTop();
    this.initThemeLinks();
    this.initMaskedTitles();
  },
};

// =============================================================================
// OFFLINE & SERVICE WORKER
// =============================================================================

const OfflineManager = {
  updateOfflineStatus() {
    const banner = document.getElementById("offline-banner");
    if (!banner) return;

    if (!navigator.onLine) {
      banner.classList.add("visible");
      document.body.classList.add("is-offline");
    } else {
      banner.classList.remove("visible");
      document.body.classList.remove("is-offline");
    }
  },

  init() {
    window.addEventListener("online", () => this.updateOfflineStatus());
    window.addEventListener("offline", () => this.updateOfflineStatus());
    this.updateOfflineStatus();
  },
};

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("/service-worker.js");
      } catch (err) {
        console.log(err);
      }
    });
  }
}

// =============================================================================
// INITIALISATION
// =============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  DayHeights.save();
  SearchManager.init();
  ImageGenerator.init();
  await FavoritesManager.init();
  KeyboardNavigation.init();
  UIManager.init();
  OfflineManager.init();
});

registerServiceWorker();
