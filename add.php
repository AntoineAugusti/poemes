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
  <style>
    body, html {
      font-size: 18px;
    }
    h1 {
      font-weight: bold;
      font-size: 1.5em;
      margin-bottom: 2em;
    }
    .container {
      background-color: var(--panel-color);
      padding: 20px;
      max-width: 800px;
      margin: 2em auto;
    }
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      box-sizing: border-box;
      font-size: 1em;
    }
    button[type="button"] {
      margin-bottom: 1em;
    }
    ul {
      list-style-type: disc;
      margin-left: 1em;
    }
    #suggested-titles li {
      cursor: pointer;
    }
    input[type="text"] {
      width: 80%;
      padding: 10px;
      margin-bottom: 1em;
    }
    input[type="date"] {
      padding: 10px;
      margin-bottom: 1em;

    }
    input[type="submit"] {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      cursor: pointer;
    }
    input[type="submit"]:hover {
      background-color: #45a049;
    }
    .message {
      margin-top: 15px;
      padding: 10px;
      margin-bottom: 2em;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .theme_suggestion {
      padding: 2px 5px;
      margin: 0 .2em .5em 0;
      background: #888;
      color: white;
      display: inline-block;
      cursor: pointer;
    }
    .theme_suggestion.active {
      background: #333;
      cursor: default;
    }
    #themes-suggestions {
      margin-bottom: 2em;
    }
    a.back {
      width: 100%;
      font-size: .8em;
      color: #888;
      text-decoration: none;
    }
  </style>
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
      <textarea required id="texte" name="texte" rows="10" cols="100"></textarea><br>

      <div id="suggested-titles"></div>

      <button id="generate-title" type="button">Générer un titre</button><br>
      
      <label for="themes">Thèmes</label><br>
      <input spellcheck="false" required type="text" id="themes" name="themes" /><br>
      <button id="generate-themes" type="button">Générer des thèmes</button><br>
      <div id="themes-suggestions"></div>

      <input type="submit" value="Ajouter le texte">
    </form>
  </div>
  <script type="text/javascript" src="theme.js"></script>
  <script>
    const themes = <?= json_encode(allThemes($THEMES_FILENAME)); ?>;
    const GEMINI_API_KEY = <?= json_encode(getenv("GEMINI_API_KEY")); ?>;
    const commonThemes = <?= json_encode(commonThemes($THEMES_FILENAME)); ?>;

    function uniqueArray(a) {
      return [...new Set(a)].sort((a, b) => a.localeCompare(b, 'fr'));
    }

    function unaccent(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function geminiCall(prompt) {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

      const headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      };

      const body = JSON.stringify({
        contents: [ {parts: [{text: prompt}]} ]
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

    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('date').valueAsDate = new Date();

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

      const generateThemes = document.getElementById('generate-themes');
      generateThemes.addEventListener('click', function() {
        generateThemes.disabled = true;
        const text = document.getElementById('texte').value;

        generateTags(text).then(response => {
          const themes = response.candidates[0].content.parts[0].text.toLowerCase();
          const themesInput = document.getElementById('themes');
          themesInput.value = themes;
          generateThemes.disabled = false;
        });
      });

      const themesInput = document.getElementById('themes');
      const themesSuggestions = document.getElementById('themes-suggestions');
      themesInput.addEventListener('input', function() {
        themesInput.value = themesInput.value.toLowerCase();
        const lastWord = themesInput.value.split(',').slice(-1)[0];
        const previousInput = themesInput.value.split(',').slice(0, -1);
        let suggestions = uniqueArray(themes);

        if (previousInput.length > 0) {
          suggestions = uniqueArray(
            previousInput
            .filter(x => x in commonThemes)
            .map(x => commonThemes[x])
            .flat()
            .concat(previousInput)
            );
        }

        themesSuggestions.innerHTML = "";
        themesSuggestions.append(...
          suggestions
          .filter(x => unaccent(x).startsWith(unaccent(lastWord)))
          .map(x => {
            const span = document.createElement('span');
            span.classList.add("theme_suggestion");
            span.innerHTML = x;
            if (!previousInput.includes(x)) {
              span.tabIndex = 0;
              span.addEventListener("click", function (event) {
                themesInput.value = previousInput.concat([event.srcElement.innerText]).join(",");
                themesInput.focus();
              });
              span.addEventListener('keydown', event => {
                if (!document.activeElement === span) {
                  return;
                }
                if (['Enter', 'Space'].includes(event.code)) {
                  event.preventDefault();
                  span.click();
                }
              });
            } else {
              span.classList.add("active");
            }
            return span;
          }));

      });
    });
  </script>
</body>
</html>