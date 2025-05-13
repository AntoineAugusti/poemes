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

function filterPoemes(searchTerm) {
  document.querySelectorAll('.poeme-titles .poeme-title.visible').forEach(poemeTitle => {
    poemeTitle.classList.remove('visible');
    poemeTitle.classList.add('hidden');
  });

  document.querySelectorAll('.poemes-container .poeme').forEach(poemeDiv => {
    const textContent = normalize(poemeDiv.querySelector('.js-poeme-search').textContent);
    const id = poemeDiv.getAttribute('data-id');

    if (textContent.includes(searchTerm)) {
      poemeDiv.classList.remove('hidden');
      poemeDiv.classList.add('visible');
      const title = document.querySelector(`.poeme-title[data-id="${id}"]`);
      if (searchTerm != '' && title) {
        title.classList.remove('hidden');
        title.classList.add('visible');
      }
    } else {
      poemeDiv.classList.remove('visible');
      poemeDiv.classList.add('hidden');
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
    else {
      const searchTerm = decodeURI(currentHash.substring(1));
      document.getElementById('search').value = searchTerm;
      filterPoemes(normalize(searchTerm));
    }
  } else {
    filterPoemes('');
  }
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

  window.addEventListener('hashchange', function(event) {
    poemeDivs = [...document.querySelectorAll('.poeme.visible')];
    currentPoemeIndex = 0;
  });

  document.querySelector('.up-down').addEventListener('click', event => {
    poemeDivs = poemeDivs.reverse();
  });

  document.addEventListener('keydown', function(event) {
    const searchInput = document.getElementById('search');
    if (searchInput != document.activeElement && event.key === 't') {
      document.querySelector('.up-down').click();
    }
    if (searchInput != document.activeElement && event.key === 'j') {
      focusPoemeDiv((currentPoemeIndex + 1) % poemeDivs.length);
    }
    if (searchInput != document.activeElement && event.key === 'k') {
      const nextIndex = currentPoemeIndex - 1;
      if (nextIndex < 0) {
        focusPoemeDiv(poemeDivs.length - 1);
      } else {
        focusPoemeDiv(nextIndex);
      }
    }
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