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

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search');
  if (searchInput) {
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
    const copyButton = container.querySelector('.js-copy-button');

    copyButton.addEventListener('click', function() {
      const range = document.createRange();
      range.selectNode(container.querySelector('.poeme-content'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      try {
        document.execCommand('copy');
        const oldContent = copyButton.innerHTML;
        copyButton.innerHTML = "Copié !";
        setTimeout(() => {
          copyButton.innerHTML = oldContent;
        }, 1_000);
      } catch (err) {
        console.error('Impossible de copier le texte : ', err);
      }

      window.getSelection().removeAllRanges();
    });
  });
});

window.addEventListener('hashchange', handleAnchorChange);
document.addEventListener('DOMContentLoaded', handleAnchorChange);
