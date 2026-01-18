<?php

require "functions.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['texte']) && !empty($_POST['texte'])) {
    $texte = str_replace("\r\n", PHP_EOL, $_POST['texte']);
    $nouveauTexte = PHP_EOL."===".PHP_EOL.$_POST['date'].PHP_EOL."## ".$_POST['titre'].PHP_EOL.$texte;

    $themes = str_replace(",", ";", $_POST['themes']);

    file_put_contents($THEMES_FILENAME, $themes.PHP_EOL, FILE_APPEND | LOCK_EX);

    if (file_put_contents($TEXTES_FILENAME, $nouveauTexte.PHP_EOL, FILE_APPEND | LOCK_EX) !== false) {
      $message = "Le texte a été ajouté avec succès !";
    } else {
      $message = "Erreur : impossible d'écrire dans le fichier.";
    }
  }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ajouter un texte</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&family=Vollkorn:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="editor.css">
</head>
<body>
  <div class="container">
    <a class="back" href="/">&laquo; Retour</a>
    <h1>Ajouter un nouveau texte</h1>

    <?php
    if (isset($message)) {
      $class = (strpos($message, 'succès') !== false) ? 'success' : 'error';
      echo '<div class="message '.$class.'">'.htmlspecialchars($message).' <a href="/">Retour</a>.</div>';
    }
    ?>

    <form method="post" action="">
      <label for="themes">Date</label><br>
      <input required type="date" id="date" name="date" max="<?= date("Y-m-d") ?>" /><br>

      <label for="titre">Titre</label><br>
      <input required type="text" name="titre" id="titre"><br>

      <label for="texte">Texte</label><br>
      <div class="editor-container">
        <div class="editor-left">
          <textarea required id="texte" name="texte" rows="10" cols="100"></textarea>
        </div>
        <div class="editor-right">
          <div id="rhymes-panel">
            <button type="button" id="rhyme-scheme-btn" onclick="toggleRhymeScheme()" style="font-size: 0.8em; padding: 2px 8px; margin-bottom: 0.5em; cursor: pointer;">Schéma: AABB</button>
            <div id="current-word"></div>
            <ul id="rhymes-list"></ul>
          </div>
        </div>
      </div>

      <div id="suggested-titles"></div>

      <button id="generate-title" type="button">Générer un titre</button><br>
      
      <label for="themes">Thèmes</label><br>
      <input spellcheck="false" required type="text" id="themes" name="themes" /><br>
      <input type="checkbox" name="checkbox" id="checkbox">
      <label for="checkbox">Poème masqué</label><br>
      <button id="generate-themes" type="button">Générer des thèmes</button><br>
      <div id="themes-counts"></div>
      <div id="themes-suggestions"></div>

      <input type="submit" value="Ajouter le texte">
    </form>
  </div>
  <script type="text/javascript" src="theme.js"></script>
  <script type="text/javascript" src="editor.js"></script>
  <script>
    const themes = <?= json_encode(allThemes($THEMES_FILENAME)); ?>;
    const GEMINI_API_KEY = <?= json_encode(getenv("GEMINI_API_KEY")); ?>;
    const commonThemes = <?= json_encode(commonThemes($THEMES_FILENAME)); ?>;
    const countThemes = <?= json_encode(countThemes($THEMES_FILENAME)); ?>;

    function geminiCall(prompt) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

      const headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      };

      const body = JSON.stringify({
        contents: [ {parts: [{text: prompt}]} ],
        generationConfig: {
          thinkingConfig: {
            includeThoughts: false,
            thinkingBudget: 0
          }
        }
      });

      try {
        return fetch(url, {
          method: 'POST',
          headers: headers,
          body: body
        })
        .then(response => response.json())
      } catch (error) {
        console.error("Error generating content:", error);
      }
    }

    function generateTitles(text) {
      return geminiCall(`Suggère-moi des titres de poèmes pour le poème suivant. Retourne unique des titres, pas de texte avant ou après, au format HTML en utilisant une liste immédiatement. ${text}`);
    }

    function generateTags(text) {
      return geminiCall(`Suggère-moi des tags pour un poème parmi une liste de tags possibles. Retourne-moi les tags, pas de texte avant ou après, au format texte et en séparant les tags par une virgule. Le maximum de tags doit être 5. Respecte la casse. Tags : ${themes}. Poème : ${text}`);
    }

    // Suggestions de rimes
    const rhymesCache = {};
    let lastRhymeWord = '';
    let rhymeScheme = 'AABB'; // AABB ou ABAB

    async function fetchRhymes(word) {
      if (!word || word.length < 2) return [];

      const cleanWord = word.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüœæç'-]/gi, '');
      if (!cleanWord) return [];

      if (rhymesCache[cleanWord]) {
        return rhymesCache[cleanWord];
      }

      try {
        const prompt = `Donne-moi 15 mots français qui riment avec "${cleanWord}". Retourne uniquement les mots séparés par des virgules, sans numérotation, sans explication, sans phrase, sans raisonnement. Juste les mots.`;
        const response = await geminiCall(prompt);
        const text = response.candidates[0].content.parts[0].text;
        const rhymes = text.split(',').map(r => r.trim().toLowerCase()).filter(r => r && r !== cleanWord);
        rhymesCache[cleanWord] = rhymes;
        return rhymes;
      } catch (error) {
        console.error('Erreur lors de la recherche de rimes:', error);
        return [];
      }
    }

    function getLastWordOfLine(line) {
      const match = line.trim().match(/(\S+)\s*$/);
      if (match) {
        return match[1].replace(/[.,;:!?'"()«»—–-]+/g, '').toLowerCase();
      }
      return null;
    }

    function getCompletedLines(textarea) {
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);

      // Séparer par lignes et filtrer les lignes vides
      const lines = textBeforeCursor.split('\n').filter(l => l.trim());
      return lines;
    }

    function getLastWordBeforePunctuation(textarea) {
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;

      // Trouver le début de la ligne courante
      let lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
      const currentLine = text.substring(lineStart, cursorPos);

      // Extraire le dernier mot avant la ponctuation
      const match = currentLine.match(/(\S+)[.,;:!?]\s*$/);
      if (match) {
        return match[1].replace(/['"()«»—–-]+/g, '');
      }
      return null;
    }

    function getRhymeSuggestionInfo(textarea) {
      const lines = getCompletedLines(textarea);
      const nextLineNumber = lines.length + 1; // Prochaine ligne à écrire (1-indexed)

      if (rhymeScheme === 'AABB') {
        // AABB: ligne 2 rime avec 1, ligne 4 rime avec 3, etc.
        if (nextLineNumber % 2 === 0) {
          // Lignes paires (2, 4, 6...) -> suggestions basées sur ligne précédente
          const targetLine = nextLineNumber - 1;
          const targetWord = lines.length >= 1 ? getLastWordOfLine(lines[targetLine - 1]) : null;
          return { show: true, targetWord, message: `Ligne ${nextLineNumber} rime avec ligne ${targetLine}` };
        } else {
          // Lignes impaires (1, 3, 5...) -> suggestions libres
          return { show: false, targetWord: null, message: '' };
        }
      } else {
        // ABAB: ligne 3 rime avec 1, ligne 4 rime avec 2, etc.
        const posInQuatrain = ((nextLineNumber - 1) % 4) + 1;

        if (posInQuatrain === 3) {
          // Lignes 3, 7, 11... -> riment avec lignes 1, 5, 9...
          const targetLine = nextLineNumber - 2;
          const targetWord = lines.length >= 2 ? getLastWordOfLine(lines[targetLine - 1]) : null;
          return { show: true, targetWord, message: `Ligne ${nextLineNumber} rime avec ligne ${targetLine}` };
        } else if (posInQuatrain === 4) {
          // Lignes 4, 8, 12... -> riment avec lignes 2, 6, 10...
          const targetLine = nextLineNumber - 2;
          const targetWord = lines.length >= 2 ? getLastWordOfLine(lines[targetLine - 1]) : null;
          return { show: true, targetWord, message: `Ligne ${nextLineNumber} rime avec ligne ${targetLine}` };
        } else {
          // Lignes 1, 2, 5, 6... -> suggestions libres
          return { show: false, targetWord: null, message: '' };
        }
      }
    }

    function displayRhymes(word, rhymes, loading = false, schemeInfo = '') {
      const currentWordEl = document.getElementById('current-word');
      const rhymesList = document.getElementById('rhymes-list');

      if (loading) {
        currentWordEl.innerHTML = `Recherche de rimes pour "<strong>${word}</strong>"…${schemeInfo}`;
        rhymesList.innerHTML = '<li style="color: var(--font-color-muted)">Chargement…</li>';
        return;
      }

      if (!word) {
        currentWordEl.textContent = '';
        rhymesList.innerHTML = '<li style="color: var(--font-color-muted)">Terminez un vers avec une ponctuation (.,;:!?) pour voir des suggestions.</li>';
        return;
      }

      currentWordEl.innerHTML = `Rimes pour "<strong>${word}</strong>"${schemeInfo}`;

      if (rhymes.length === 0) {
        rhymesList.innerHTML = '<li style="color: var(--font-color-muted)">Aucune rime trouvée</li>';
        return;
      }

      rhymesList.innerHTML = rhymes.map(rhyme =>
        `<li data-rhyme="${rhyme}">${rhyme}</li>`
      ).join('');
    }

    async function updateRhymes(textarea, forceUpdate = false) {
      const currentWord = getLastWordBeforePunctuation(textarea);
      if (!currentWord) return;

      const info = getRhymeSuggestionInfo(textarea);

      // Si pas besoin de suggestions (AABB sur ligne paire)
      if (!info.show) {
        const currentWordEl = document.getElementById('current-word');
        const rhymesList = document.getElementById('rhymes-list');
        currentWordEl.innerHTML = `<span style="color: var(--font-color-muted)">${info.message}</span>`;
        rhymesList.innerHTML = '';
        lastRhymeWord = '';
        return;
      }

      // Mot pour lequel chercher des rimes
      const wordToRhyme = info.targetWord || currentWord;
      const schemeInfo = info.message
        ? `<br><span style="font-size: 0.8em; color: var(--font-color-muted)">${info.message}</span>`
        : '';

      if (wordToRhyme === lastRhymeWord && !forceUpdate) return;
      lastRhymeWord = wordToRhyme;

      displayRhymes(wordToRhyme, [], true, schemeInfo);
      const rhymes = await fetchRhymes(wordToRhyme);
      displayRhymes(wordToRhyme, rhymes, false, schemeInfo);
    }

    function toggleRhymeScheme() {
      rhymeScheme = rhymeScheme === 'AABB' ? 'ABAB' : 'AABB';
      document.getElementById('rhyme-scheme-btn').textContent = `Schéma: ${rhymeScheme}`;
    }

    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('date').valueAsDate = new Date();

      // Initialiser le panneau de rimes
      const texteArea = document.getElementById('texte');
      const rhymesList = document.getElementById('rhymes-list');

      // Déclencher la recherche de rimes quand la ligne se termine par une ponctuation
      let lastValue = '';
      texteArea.addEventListener('input', function() {
        const currentValue = texteArea.value;
        // Vérifier si un caractère de ponctuation a été ajouté
        if (currentValue.length > lastValue.length) {
          const addedChar = currentValue[texteArea.selectionStart - 1];
          if ([',', '.', ';', ':', '!', '?'].includes(addedChar)) {
            updateRhymes(texteArea);
          }
        }
        lastValue = currentValue;
      });

      // Cliquer sur une rime pour l'insérer
      rhymesList.addEventListener('click', function(e) {
        const li = e.target.closest('li');
        if (li && li.dataset.rhyme) {
          const rhyme = li.dataset.rhyme;
          const cursorPos = texteArea.selectionStart;
          const text = texteArea.value;

          // Insérer la rime à la position du curseur
          texteArea.value = text.substring(0, cursorPos) + ' ' + rhyme;
          texteArea.focus();
          texteArea.selectionStart = texteArea.selectionEnd = cursorPos + rhyme.length + 1;
        }
      });

      displayRhymes('', []);

      const generateTitle = document.getElementById('generate-title');

      generateTitle.addEventListener('click', function() {
        generateTitle.disabled = true;
        const text = document.getElementById('texte').value;

        generateTitles(text).then(response => {
          const suggestedTitles = document.getElementById('suggested-titles');
          const titreInput = document.getElementById('titre');

          const titles = response.candidates[0].content.parts[0].text;
          suggestedTitles.innerHTML = titles;
          generateTitle.disabled = false;

          suggestedTitles.addEventListener('click', function(event) {
            const clickedLi = event.target.closest('li');
            if (clickedLi) {
              const liText = clickedLi.textContent.trim();
              titreInput.value = liText;
            }
          });
        });
      });

      const checkbox = document.getElementById('checkbox');
      checkbox.addEventListener('click', function () {
        const themesInput = document.getElementById('themes');
        if (checkbox.checked) {
          if (themesInput.value === '') {
            themesInput.value = 'masqué'
          }
          else {
            themesInput.value = themesInput.value.replace(/,$/, '') + ',masqué'
          }
        }
        else {
          themesInput.value = themesInput.value.replace(/(,)?masqué/, '')
        }
      })

      const generateThemes = document.getElementById('generate-themes');
      generateThemes.addEventListener('click', function() {
        generateThemes.disabled = true;
        const text = document.getElementById('texte').value;

        generateTags(text).then(response => {
          const themes = response.candidates[0].content.parts[0].text.toLowerCase();
          const themesInput = document.getElementById('themes');
          themesInput.value = uniqueArray(themes.split(",")).join(",");
          themesInput.dispatchEvent(new Event('input', {
            bubbles: true,
            cancelable: true
          }));
          generateThemes.disabled = false;
        });
      });

      initThemesSuggestions(themes, commonThemes, countThemes);
    });
  </script>
</body>
</html>