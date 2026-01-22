<?php

require "functions.php";

$host = $_SERVER['HTTP_HOST'];
$isAdmin = $_COOKIE["email"] == getenv("ADMIN_EMAIL");

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
  <link rel="stylesheet" href="editor.css">
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
  <script type="text/javascript" src="editor.js"></script>
  <script>
    const themes = <?= json_encode(allThemes($THEMES_FILENAME)); ?>;
    const commonThemes = <?= json_encode(commonThemes($THEMES_FILENAME)); ?>;
    const countThemes = <?= json_encode(countThemes($THEMES_FILENAME)); ?>;

    document.addEventListener('DOMContentLoaded', function() {
      const updateThemesSuggestions = initThemesSuggestions(themes, commonThemes, countThemes);
      updateThemesSuggestions();
    });
  </script>
</body>
</html>
