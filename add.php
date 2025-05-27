<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (isset($_POST['poeme']) && !empty($_POST['poeme'])) {
    $nouveauPoeme = "\n===\n" . $_POST['poeme'];
    $poemesFile = 'poemes.txt';

    $themes = str_replace(",", ";", $_POST['themes']);
    $themesFile = 'themes.txt';

    file_put_contents($themesFile, $themes."\r", FILE_APPEND | LOCK_EX);

    if (file_put_contents($poemesFile, $nouveauPoeme . "\n", FILE_APPEND | LOCK_EX) !== false) {
      $message = "Le poème a été ajouté avec succès !";
    } else {
      $message = "Erreur : Impossible d'écrire dans le fichier.";
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
      border-radius: 8px;
      max-width: 800px;
      margin: 2em auto;
    }
    textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
      margin-bottom: 2em;
    }
    input[type="text"] {
      width: 80%;
      padding: 10px;
      margin-bottom: 2em;
    }
    input[type="submit"] {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    input[type="submit"]:hover {
      background-color: #45a049;
    }
    .message {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>Ajouter un nouveau poème</h1>

    <?php
    if (isset($message)) {
      $class = (strpos($message, 'succès') !== false) ? 'success' : 'error';
      echo '<div class="message ' . $class . '">' . htmlspecialchars($message) . '</div>';
    }
    ?>

    <form method="post" action="">
      <label for="poeme">Poème</label><br>
      <textarea required id="poeme" name="poeme" rows="10" cols="100"></textarea><br>
      
      <label for="themes">Thèmes</label><br>
      <input required type="text" id="themes" name="themes" /><br>

      <input type="submit" value="Ajouter le poème">
    </form>
  </div>
</body>
</html>