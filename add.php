<?php

require "functions.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['poeme']) && !empty($_POST['poeme'])) {
    $poeme = str_replace("\r\n", PHP_EOL, $_POST['poeme']);
    $nouveauPoeme = PHP_EOL."===".PHP_EOL.$_POST['date'].PHP_EOL.$poeme;
    $poemesFile = 'poemes.txt';

    $themes = str_replace(",", ";", $_POST['themes']);
    $themesFile = 'themes.txt';

    file_put_contents($themesFile, $themes.PHP_EOL, FILE_APPEND | LOCK_EX);

    if (file_put_contents($poemesFile, $nouveauPoeme.PHP_EOL, FILE_APPEND | LOCK_EX) !== false) {
      $message = "Le poème a été ajouté avec succès !";
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
  <title>Ajouter un poème</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&family=Vollkorn:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      font-size: 18px;
    }
    h1 {
      font-weight: bold;
      font-size: 1.5em;
      margin-bottom: 2em;
    }
    .container {
      background-color: #fff;
      padding: 20px;
      max-width: 800px;
      margin: 2em auto;
    }
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      box-sizing: border-box;
      margin-bottom: 2em;
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
    <h1>Ajouter un nouveau poème</h1>

    <?php
    if (isset($message)) {
      $class = (strpos($message, 'succès') !== false) ? 'success' : 'error';
      echo '<div class="message '.$class.'">'.htmlspecialchars($message).' <a href="/">Retour</a>.</div>';
    }
    ?>

    <form method="post" action="">
      <label for="themes">Date</label><br>
      <input required type="date" id="date" name="date" max="<?= date("Y-m-d") ?>" /><br>

      <label for="poeme">Poème</label><br>
      <textarea required id="poeme" name="poeme" rows="10" cols="100">## </textarea><br>
      
      <label for="themes">Thèmes</label><br>
      <input spellcheck="false" required type="text" id="themes" name="themes" /><br>
      <div id="themes-suggestions"></div>

      <input type="submit" value="Ajouter le poème">
    </form>
  </div>
  <script>
    const themes = <?= json_encode(allThemes()); ?>;
    const commonThemes = <?= json_encode(commonThemes()); ?>;
    function uniqueArray(a) {
      return [...new Set(a)].sort((a, b) => a.localeCompare(b, 'fr'));
    }
    function unaccent(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('date').valueAsDate = new Date();

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