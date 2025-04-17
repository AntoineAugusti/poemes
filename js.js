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

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');

  const hash = window.location.hash;
  if (hash && hash.startsWith('#')) {
    const searchTerm = hash.substring(1);
    search.value = searchTerm;
    filterPoemes(searchTerm);
  }

  searchInput.addEventListener('input', function() {
    const searchTerm = normalize(this.value);
    window.location.hash = searchTerm;
    filterPoemes(searchTerm);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === '/') {
    const searchDiv = document.getElementById('search');
    searchDiv.focus();
    event.preventDefault();
  }
});
document.addEventListener('DOMContentLoaded', function() {
  const poemeContainers = document.querySelectorAll('.poeme-container');

  poemeContainers.forEach(container => {
    const poemeDiv = container.querySelector('.poeme-content');
    const copyButton = container.querySelector('.copy-button');

    copyButton.addEventListener('click', function() {
      const range = document.createRange();
      range.selectNode(poemeDiv);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      try {
        document.execCommand('copy');
        copyButton.innerHTML = "Copié !";
        setTimeout(() => {
          copyButton.innerHTML = "Copier";
        }, 1000);
      } catch (err) {
        console.error('Impossible de copier le texte : ', err);
      }

      window.getSelection().removeAllRanges();
    });
  });
});
function handleAnchorChange() {
  const currentHash = window.location.hash;

  if (currentHash) {
    const targetId = currentHash.substring(1);
    const targetDiv = document.querySelector(`div[data-id="${targetId}"]`);

    if (targetDiv) {
      targetDiv.classList.add('visible');

      const allVisibleDivs = document.querySelectorAll('.visible');
      allVisibleDivs.forEach(div => {
        if (div !== targetDiv) {
          div.classList.remove('visible');
          div.classList.add('hidden');
        }
      });
    }
  } else {
    const allPoemeDivs = document.querySelectorAll('.poeme');
    allPoemeDivs.forEach(div => {
      div.classList.remove('hidden');
      div.classList.add('visible');
    });
  }
}

window.addEventListener('hashchange', handleAnchorChange);
document.addEventListener('DOMContentLoaded', handleAnchorChange);
