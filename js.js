function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterPoemes(searchTerm) {
  document.querySelectorAll('.poeme').forEach(poemeDiv => {
    const textContent = normalize(poemeDiv.textContent);

    if (textContent.includes(searchTerm)) {
      poemeDiv.classList.remove('hidden');
      poemeDiv.classList.add('visible');
    } else {
      poemeDiv.classList.remove('visible');
      poemeDiv.classList.add('hidden');
    }
  });

  const nbResults = document.querySelector("#nb-results");
  if (searchTerm != "") {
    const nbPoemes = document.querySelectorAll('.poeme.visible').length
    const text = nbPoemes == 1 ? "poème" : "poèmes";
    nbResults.textContent = `${nbPoemes} ${text}`
  } else {
    nbResults.textContent = '';
  }
}

function handleAnchorChange() {
  const currentHash = window.location.hash;

  if (currentHash) {
    const targetId = currentHash.substring(1);
    const targetDiv = document.querySelector(`div[data-id="${targetId}"]`);

    if (targetDiv) {
      document.querySelectorAll('.visible').forEach(div => {
        div.classList.remove('visible');
        div.classList.add('hidden');
      });

      targetDiv.classList.add('visible');
    }
  } else {
    filterPoemes('');
  }
}

function copyContent(container, source, target) {
  const src = container.querySelector(source);
  src.addEventListener('click', function() {
    const content = container.querySelector(target).textContent.trim();
    navigator.clipboard.writeText(content);

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
      filterPoemes(searchTerm);
    }

    searchInput.addEventListener('input', function() {
      const searchTerm = normalize(this.value);
      window.location.hash = searchTerm;
      filterPoemes(searchTerm);
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
        target.classList.remove("visible");
        target.classList.add("hidden");
      } else {
        target.classList.remove("hidden");
        target.classList.add("visible");
      }
    })
  });
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.up-down').addEventListener('click', event => {
    const container = document.querySelector('.poemes-container');
    if (container.classList.contains("reverse")) {
        container.classList.remove("reverse");
      } else {
        container.classList.add("reverse");
      }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  let poemeDivs = [...document.querySelectorAll('.poeme.visible')];
  let currentPoemeIndex = 0;

  function focusPoemeDiv(index) {
    currentPoemeIndex = index;
    if (poemeDivs[currentPoemeIndex]) {
      poemeDivs[currentPoemeIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  window.addEventListener('hashchange', function(event) {
    poemeDivs = [...document.querySelectorAll('.poeme.visible')];
    currentPoemeIndex = 0;
  });

  document.querySelector('.up-down').addEventListener('click', event => {
    poemeDivs = poemeDivs.reverse();
  });

  document.addEventListener('keydown', function(event) {
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
