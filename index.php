<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poésie</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div class="search_wrapper">
      <input type="text" id="search">
    </div>
    <?php
    $i = 1;
    foreach (explode("===", file_get_contents("poemes.txt")) as $poeme) { ?>
      <div class="poeme-container">
        <div class="poeme visible" data-id="<?php echo $i ?>">
          <a class="id" href="#<?php echo $i ?>">
            <?php echo $i ?>
          </a>
          <div class="poeme-content">
            <?php echo nl2br(trim($poeme)) ?>
          </div>
          <div class="copy-button">
            <img src="data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNiAxOGgtM2MtLjQ4IDAtMS0uMzc5LTEtMXYtMTRjMC0uNDgxLjM4LTEgMS0xaDE0Yy42MjEgMCAxIC41MjIgMSAxdjNoM2MuNjIxIDAgMSAuNTIyIDEgMXYxNGMwIC42MjEtLjUyMiAxLTEgMWgtMTRjLS40OCAwLTEtLjM3OS0xLTF6bTEuNS0xMC41djEzaDEzdi0xM3ptOS0xLjV2LTIuNWgtMTN2MTNoMi41di05LjVjMC0uNDgxLjM4LTEgMS0xeiIgZmlsbC1ydWxlPSJub256ZXJvIi8+PC9zdmc+">
            Copier
          </div>
        </div>
      </div>
      <?php $i++ ?>
    <?php } ?>
  </div>
  <script type="text/javascript" src="js.js"></script>
</body>
</html>
