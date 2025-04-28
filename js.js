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
    copyContent(container, '.js-copy-button', '.poeme-content');
    copyContent(container, '.js-share-button', '.js-share-url');
  });
});

window.addEventListener('hashchange', handleAnchorChange);
document.addEventListener('DOMContentLoaded', handleAnchorChange);

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.js-notes-auteur').forEach(function (div) {
    div.addEventListener('click', function (event) {
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
