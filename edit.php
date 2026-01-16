<?php

require "functions.php";

$host = $_SERVER['HTTP_HOST'];
$isAdmin = $_COOKIE["email"] == "antoine.augusti@gmail.com" || $host != "poemes.antoine-augusti.fr";

if (!$isAdmin) {
  header("Location: /", true, 302);
  exit();
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
  header("Location: /", true, 302);
  exit();
}

// Load poems and themes
$themes = explode("\n", file_get_contents($THEMES_FILENAME));
$poemes = explode("===", file_get_contents($TEXTES_FILENAME));

// Convert to 0-indexed for the arrays
$index = $id - 1;

if (!isset($poemes[$index])) {
  header("Location: /", true, 302);
  exit();
}

$poeme = $poemes[$index];
$matches = parsePoeme($poeme);
$poemeThemes = isset($themes[$index]) ? str_replace(";", ",", trim($themes[$index])) : "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['texte']) && !empty($_POST['texte'])) {
    $texte = str_replace("\r\n", PHP_EOL, $_POST['texte']);
    $newThemes = str_replace(",", ";", $_POST['themes']);

    // Build the new poem content
    $nouveauPoeme = PHP_EOL . $_POST['date'] . PHP_EOL . "## " . $_POST['titre'] . PHP_EOL . $texte . PHP_EOL;

    // Update the poem in the array
    $poemes[$index] = $nouveauPoeme;

    // Update themes
    $themes[$index] = $newThemes;

    // Write back to files
    $poemesContent = implode("===", $poemes);
    $themesContent = implode("\n", $themes);

    if (file_put_contents($TEXTES_FILENAME, $poemesContent, LOCK_EX) !== false &&
        file_put_contents($THEMES_FILENAME, $themesContent, LOCK_EX) !== false) {
      $message = "Le poème a été modifié avec succès !";

      // Reload the data
      $poeme = $nouveauPoeme;
      $matches = parsePoeme($poeme);
      $poemeThemes = $_POST['themes'];
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
  <title>Modifier le poème #<?= $id ?></title>
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
      height: auto;
    }
    h1 {
      font-weight: bold;
      font-size: 1.5em;
      margin-bottom: 2em;
      text-shadow: 2px 2px 3px rgba(128, 128, 128, 0.5);
      background-clip: text;
      background-color: #000;
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
      box-sizing: border-box;
      font-size: 1em;
    }
    input[type="text"] {
      width: 100%;
      padding: 10px;
      margin-bottom: 1em;
      box-sizing: border-box;
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
    .label {
      padding: 2px 5px;
      margin: 0 .5em .5em 0;
      background: #aaa;
      color: white;
      display: inline-block;
      cursor: pointer;
      font-size: 0.8em;
    }
    #themes-counts {
      margin-bottom: 1em;
    }
    #themes-suggestions {
      margin-bottom: 2em;
    }
    a.back {
      width: 100%;
      font-size: .8em;
      color: #ccc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="/#<?= $id ?>">&laquo; Retour au poème</a>
    <h1>Modifier le poème #<?= $id ?></h1>

    <?php
    if (isset($message)) {
      $class = (strpos($message, 'succès') !== false) ? 'success' : 'error';
      echo '<div class="message '.$class.'">'.htmlspecialchars($message).' <a href="/#'.$id.'">Voir le poème</a>.</div>';
    }
    ?>

    <form method="post" action="">
      <label for="date">Date</label><br>
      <input required type="date" id="date" name="date" value="<?= htmlspecialchars($matches['date'] ?? '') ?>" max="<?= date("Y-m-d") ?>" /><br>

      <label for="titre">Titre</label><br>
      <input required type="text" name="titre" id="titre" value="<?= htmlspecialchars($matches['titre'] ?? '') ?>"><br>

      <label for="texte">Texte</label><br>
      <textarea required id="texte" name="texte" rows="15" cols="100"><?= htmlspecialchars(trim($matches['poeme'] ?? '')) ?></textarea><br><br>

      <label for="themes">Thèmes</label><br>
      <input spellcheck="false" required type="text" id="themes" name="themes" value="<?= htmlspecialchars($poemeThemes) ?>" /><br>
      <div id="themes-counts"></div>
      <div id="themes-suggestions"></div>

      <input type="submit" value="Enregistrer les modifications">
    </form>
  </div>
  <script type="text/javascript" src="theme.js"></script>
  <script>
    const themes = <?= json_encode(allThemes($THEMES_FILENAME)); ?>;
    const commonThemes = <?= json_encode(commonThemes($THEMES_FILENAME)); ?>;
    const countThemes = <?= json_encode(countThemes($THEMES_FILENAME)); ?>;

    function uniqueArray(a) {
      return [...new Set(a)].sort((a, b) => a.localeCompare(b, 'fr'));
    }

    function unaccent(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    document.addEventListener('DOMContentLoaded', function() {
      const themesInput = document.getElementById('themes');
      const themesSuggestions = document.getElementById('themes-suggestions');
      const themesCounts = document.getElementById('themes-counts');

      function updateThemesSuggestions() {
        themesInput.value = themesInput.value.toLowerCase();
        const lastWord = themesInput.value.split(',').slice(-1)[0];
        const previousInput = themesInput.value.split(',').slice(0, -1);
        let suggestions = uniqueArray(themes);
        themesCounts.textContent = '';

        themesInput.value.split(',')
        .filter(x => x in countThemes)
        .forEach((tag) => {
          const span = document.createElement('span');
          span.textContent = `${tag} (${countThemes[tag]})`;
          span.setAttribute('class', 'label');
          themesCounts.appendChild(span);
        })

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
                themesInput.dispatchEvent(new Event('input', {
                  bubbles: true,
                  cancelable: true
                }));
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
      }

      themesInput.addEventListener('input', updateThemesSuggestions);

      // Initial update
      updateThemesSuggestions();
    });
  </script>
</body>
</html>
