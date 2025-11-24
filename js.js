/*global Mark*/
/*global SimpleWebAuthnBrowser*/
let AUTH_SERVER_URL = "https://poemes.antoine-augusti.fr/api";
if (document.location.origin == "http://localhost:8080") {
  AUTH_SERVER_URL = "http://localhost:3000";
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return decodeURIComponent(parts.pop().split(";").shift());
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function loginError(message) {
  if (message == "User already exists") {
    const email = getCookie("email") || document.getElementById("email").value;
    setCookie("email", email, 90);
    window.location.href = "/";
    return;
  }
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  document.getElementById("loader").classList.add("hidden");
  document.getElementById("welcome").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}

async function signup(email) {
  const initResponse = await fetch(
    `${AUTH_SERVER_URL}/init-register?email=${email}`,
    { credentials: "include" },
  );
  const options = await initResponse.json();
  if (!initResponse.ok) {
    loginError(options.error);
  }

  const registrationJSON =
    await SimpleWebAuthnBrowser.startRegistration(options);

  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/verify-register`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationJSON),
  });

  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok) {
    console.log(verifyData.error);
  }
  if (verifyData.verified) {
    setCookie("email", email, 90);
    console.log(`Successfully registered ${email}`);
  } else {
    console.log(`Failed to register`);
  }
}

async function login(email) {
  const initResponse = await fetch(
    `${AUTH_SERVER_URL}/init-auth?email=${email}`,
    {
      credentials: "include",
    },
  );
  const options = await initResponse.json();
  if (!initResponse.ok) {
    loginError(options.error);
  }

  const authJSON = await SimpleWebAuthnBrowser.startAuthentication(options);

  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/verify-auth`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(authJSON),
  });

  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok) {
    console.log(verifyData.error);
  }
  if (verifyData.verified) {
    setCookie("email", email, 90);
    console.log(`Successfully logged in ${email}`);
  } else {
    loginError(`Failed to log in`);
  }
}

function submitLoginForm(email) {
  document.getElementById("error-message").classList.add("hidden");
  document.getElementById("form").classList.add("hidden");
  document.getElementById("loader").classList.remove("hidden");

  document.getElementById("welcome").textContent = `Hello, ${email}`;
  document.getElementById("welcome").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  async function checkLogin() {
    if (new URLSearchParams(window.location.search).get("action") == "login") {
      let email = getCookie("email");
      if (email == undefined) {
        document
          .getElementById("form")
          .addEventListener("submit", async (event) => {
            event.preventDefault();
            email = document.getElementById("email").value;
            submitLoginForm(email);
            await login(email);
            setTimeout(async () => {
              window.location.href = "/";
            }, 2_000);
          });
      } else {
        submitLoginForm(email);
        await login(email);
        setTimeout(async () => {
          window.location.href = "/";
        }, 2_000);
      }
    }
  }

  async function checkSignup() {
    if (new URLSearchParams(window.location.search).get("action") == "signup") {
      document
        .getElementById("form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const email = document.getElementById("email").value;
          submitLoginForm(email);
          await signup(email);
          setTimeout(async () => {
            window.location.href = "/";
          }, 2_000);
        });
    }
  }

  await checkLogin();
  await checkSignup();
});

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
  if (searchTerm != "") {
    const nbPoemes = document.querySelectorAll(
      ".poemes-container .poeme.visible",
    ).length;
    const text = nbPoemes == 1 ? "poème" : "poèmes";
    nbResults.textContent = `${nbPoemes} ${text}`;
  } else {
    nbResults.textContent = "";
  }
}

function filterPoemes(searchTerm) {
  document
    .querySelectorAll(".poeme-titles .poeme-title.visible")
    .forEach((poemeTitle) => hide(poemeTitle));
  document.querySelectorAll(".day.visible").forEach((day) => hide(day));

  document.querySelectorAll(".poemes-container .poeme").forEach((poemeDiv) => {
    let date = null;
    const poemeDate = poemeDiv.querySelector(".poeme-date");
    if (poemeDate) {
      date = poemeDate.textContent.trim();
    }

    const textContent = normalize(
      poemeDiv.querySelector(".js-poeme-search").textContent,
    );
    const id = poemeDiv.getAttribute("data-id");

    let searchTest = includesAnyWord(
      textContent,
      searchTerm.split(" ").filter((word) => word != ""),
    );
    if (searchTerm.startsWith('"') || searchTerm.startsWith("#")) {
      searchTest = textContent.includes(searchTerm.replaceAll('"', ""));
    }

    if (searchTerm.trim() == "") {
      searchTest = true;
    }

    // Matches `123-`
    if (searchTerm.match(/^(\d+)-$/)) {
      const matchedId = parseInt(searchTerm.match(/^(\d+)-/)[1]);
      searchTest = parseInt(id) >= matchedId;
    }

    // Matches `123-130` but not dates
    if (
      searchTerm.match(/^(\d+)-(\d+)$/) &&
      !/^\d{4}-\d{2}$/.test(searchTerm)
    ) {
      const matches = searchTerm.match(/^(\d+)-(\d+)$/);
      const start = parseInt(matches[1]);
      const end = parseInt(matches[2]);
      searchTest = parseInt(id) >= start && parseInt(id) <= end;
    }

    // Matches `2025-10-01-`
    if (date && /^\d{4}-\d{2}-\d{2}-$/.test(searchTerm)) {
      const start = new Date(searchTerm.match(/^(\d{4}-\d{2}-\d{2})-$/)[1]);
      searchTest = new Date(date) >= start;
    }

    // Matches `2025-10-01-2025-10-10`
    if (date && /^\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}$/.test(searchTerm)) {
      const matches = searchTerm.match(
        /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/,
      );
      const start = new Date(matches[1]);
      const end = new Date(matches[2]);
      searchTest = new Date(date) >= start && new Date(date) <= end;
    }

    if (searchTest) {
      show(poemeDiv);
      const title = document.querySelector(`.poeme-title[data-id="${id}"]`);
      if (searchTerm != "" && title) {
        show(title);
      }
      if (date != null) {
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
});
document.addEventListener("keydown", () => {
  if (event.key === "/") {
    const searchDiv = document.getElementById("search");
    searchDiv.focus();
    event.preventDefault();
  }
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

  document.addEventListener("keydown", () => {
    const searchInput = document.getElementById("search");
    if (searchInput == document.activeElement) {
      return;
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
    searchAllPoems();
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
        searchAllPoems();
        hide(poemeTitlesReset);
      }
      document.dispatchEvent(new Event("poemes-changed", { bubbles: true }));
    });
  });
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
