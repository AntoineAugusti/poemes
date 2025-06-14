function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function toggleReverse(div) {
  if (div.classList.contains("reverse")) {
    div.classList.remove("reverse");
  } else {
    div.classList.add("reverse");
  }
}

function hide(div) {
  div.classList.remove('visible');
  div.classList.add('hidden');
}

function show(div) {
  div.classList.remove('hidden');
  div.classList.add('visible');
}

function filterPoemes(searchTerm) {
  document.querySelectorAll('.poeme-titles .poeme-title.visible').forEach(poemeTitle => hide(poemeTitle));

  document.querySelectorAll('.poemes-container .poeme').forEach(poemeDiv => {
    const textContent = normalize(poemeDiv.querySelector('.js-poeme-search').textContent);
    const id = poemeDiv.getAttribute('data-id');

    if (textContent.includes(searchTerm)) {
      show(poemeDiv);
      const title = document.querySelector(`.poeme-title[data-id="${id}"]`);
      if (searchTerm != '' && title) {
        show(title);
      }
    } else {
      hide(poemeDiv);
    }
  });

  const nbResults = document.querySelector("#nb-results");
  if (searchTerm != "") {
    const nbPoemes = document.querySelectorAll('.poemes-container .poeme.visible').length
    const text = nbPoemes == 1 ? "poème" : "poèmes";
    nbResults.textContent = `${nbPoemes} ${text}`
  } else {
    nbResults.textContent = '';
  }
}

function handleAnchorChange() {
  const currentHash = window.location.hash;
  const search = document.getElementById('search');

  if (currentHash) {
    const targetId = currentHash.substring(1);
    const targetDiv = document.querySelector(`div[data-id="${targetId}"]`);
    const searchTerm = decodeURI(currentHash.substring(1));
    if (search) {
      search.value = searchTerm;
    }

    if (targetDiv) {
      document.querySelectorAll('.visible').forEach(div => hide(div));
      show(targetDiv);
    }
    else {
      filterPoemes(normalize(searchTerm));
    }
  } else {
    filterPoemes('');
  }

  document.querySelectorAll('.poeme-title.active').forEach(span => span.classList.remove('active'));
  hide(document.getElementById('reset-poeme-titles'));
}

function copyContent(container, source, target) {
  const src = container.querySelector(source);
  src.addEventListener('click', function() {
    const toShow = container.querySelectorAll('.to_show');
    toShow.forEach(div => div.classList.add("visible"));

    const content = container.querySelector(target).textContent.trim().replace(/( ){10,}/, '\n');
    navigator.clipboard.writeText(content);

    toShow.forEach(div => div.classList.remove("visible"));

    const oldContent = src.innerHTML;
    src.innerHTML = "Copié !";
    setTimeout(() => {
      src.innerHTML = oldContent;
    }, 1_500);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');
  if (searchInput) {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const searchTerm = decodeURI(hash.substring(1));
      search.value = searchTerm;
    }

    searchInput.addEventListener('input', function() {
      window.location.hash = this.value;
      filterPoemes(normalize(this.value));
    });
  }

});
document.addEventListener('keydown', event => {
  if (event.key === '/') {
    const searchDiv = document.getElementById('search');
    searchDiv.focus();
    event.preventDefault();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.poeme-container').forEach(container => {
    copyContent(container, '.js-copy-button', '.poeme-text');
    copyContent(container, '.js-share-button', '.js-share-url');
  });
});

window.addEventListener('hashchange', handleAnchorChange);
document.addEventListener('DOMContentLoaded', handleAnchorChange);

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.js-notes-auteur').forEach(function (div) {
    div.addEventListener('click', event => {
      const target = document.querySelector(".poeme-notes");
      if (target.classList.contains("visible")) {
        hide(target);
      } else {
        show(target);
      }
    })
  });
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.up-down').addEventListener('click', function (event) {
    const container = document.querySelector('.poemes-container');
    toggleReverse(container);
    toggleReverse(document.querySelector('.poeme-titles'));

    container.querySelectorAll('.poeme-container').forEach(div => {
      div.classList.add("animate__animated", "animate__fadeInDown");
      div.addEventListener('animationend', () => {
        div.classList.remove("animate__animated", "animate__fadeInDown");
      });
    })
  });
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll(`[tabindex="0"]`).forEach(div => {
    div.addEventListener('keydown', event => {
      if (!document.activeElement === div) {
        return;
      }
      if (['Enter', 'Space'].includes(event.code)) {
        event.preventDefault();
        div.click();
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  let poemeDivs = [...document.querySelectorAll('.poeme.visible')];
  let currentPoemeIndex = 0;

  function focusPoemeDiv(index) {
    currentPoemeIndex = index;
    if (poemeDivs[currentPoemeIndex]) {
      poemeDivs[currentPoemeIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      poemeDivs[currentPoemeIndex].classList.add("animate__animated", "animate__fadeIn")
      poemeDivs[currentPoemeIndex].addEventListener('animationend', () => {
        poemeDivs[currentPoemeIndex].classList.remove("animate__animated", "animate__fadeIn");
      });
    }
  }

  function refreshPoemes() {
    poemeDivs = [...document.querySelectorAll('.poeme.visible')];
    currentPoemeIndex = 0;
  }

  window.addEventListener('hashchange', event => refreshPoemes());
  window.addEventListener('poemes-changed', event => refreshPoemes());

  document.querySelector('.up-down').addEventListener('click', event => poemeDivs = poemeDivs.reverse());

  document.addEventListener('keydown', event => {
    const searchInput = document.getElementById('search');
    if (searchInput == document.activeElement) {
      return;
    }
    if (event.key === 't') {
      document.querySelector('.up-down').click();
    }
    if (event.key === 'j') {
      focusPoemeDiv((currentPoemeIndex + 1) % poemeDivs.length);
    }
    if (event.key === 'k') {
      const nextIndex = currentPoemeIndex - 1;
      if (nextIndex < 0) {
        focusPoemeDiv(poemeDivs.length - 1);
      } else {
        focusPoemeDiv(nextIndex);
      }
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  function searchAllPoems() {
    const searchTerm = decodeURI(window.location.hash.substring(1));
    filterPoemes(normalize(searchTerm));
  }

  const poemeTitlesReset = document.getElementById('reset-poeme-titles');

  poemeTitlesReset.addEventListener('click', event => {
    document.querySelectorAll('.poeme-titles .poeme-title.active').forEach(title => {
      title.classList.remove("active");
    });
    searchAllPoems();
    hide(poemeTitlesReset);
  });

  document.querySelectorAll('.poeme-titles .poeme-title').forEach(title => {
    title.addEventListener('click', event => {
      if (title.classList.contains("active")) {
        title.classList.remove("active");
      } else {
        title.classList.add("active");
        show(poemeTitlesReset);
      }
      document.querySelectorAll('.poemes-container .poeme').forEach(div => hide(div));

      const activeTitles = document.querySelectorAll('.poeme-titles .poeme-title.active');
      activeTitles.forEach(function (title) {
        const targetId = title.getAttribute('data-id');
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register('/service-worker.js');
    } catch (err) {
      console.log(err);
    }
  });
}