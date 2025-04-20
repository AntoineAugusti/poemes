<?php
$signature = $_GET['signature'];
?>
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
    <?php if (empty($signature)) { ?>
      <div class="search_wrapper">
        <input type="text" id="search">
      </div>
    <?php } ?>
    <?php
    $i = 1;
    foreach (explode("===", file_get_contents("poemes.txt")) as $poeme) { ?>
      <?php $poeme_signature = md5($poeme); ?>
      <div class="poeme-container">
        <div class="poeme visible" data-id="<?php echo $i ?>">
          <a class="id" href="#<?php echo $i ?>">
            <?php echo $i ?>
          </a>
          <div class="poeme-content">
            <?php
            if (empty($signature) or $signature == $poeme_signature) {
              echo nl2br(trim($poeme));
            } ?>
          </div>
          <div class="action-button js-copy-button">
            <img src="data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNiAxOGgtM2MtLjQ4IDAtMS0uMzc5LTEtMXYtMTRjMC0uNDgxLjM4LTEgMS0xaDE0Yy42MjEgMCAxIC41MjIgMSAxdjNoM2MuNjIxIDAgMSAuNTIyIDEgMXYxNGMwIC42MjEtLjUyMiAxLTEgMWgtMTRjLS40OCAwLTEtLjM3OS0xLTF6bTEuNS0xMC41djEzaDEzdi0xM3ptOS0xLjV2LTIuNWgtMTN2MTNoMi41di05LjVjMC0uNDgxLjM4LTEgMS0xeiIgZmlsbC1ydWxlPSJub256ZXJvIi8+PC9zdmc+">
            Copier
          </div>
          <div class="action-button">
            <a href="/share?signature=<?php echo $poeme_signature; ?>#<?php echo $i; ?>">
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNiAxN2MyLjI2OS05Ljg4MSAxMS0xMS42NjcgMTEtMTEuNjY3di0zLjMzM2w3IDYuNjM3LTcgNi42OTZ2LTMuMzMzcy02LjE3LS4xNzEtMTEgNXptMTIgLjE0NXYyLjg1NWgtMTZ2LTEyaDYuNTk4Yy43NjgtLjc4NyAxLjU2MS0xLjQ0OSAyLjMzOS0yaC0xMC45Mzd2MTZoMjB2LTYuNzY5bC0yIDEuOTE0eiIvPjwvc3ZnPg==">
              Partager
            </a>
          </div>
        </div>
      </div>
      <?php $i++ ?>
    <?php } ?>
  </div>
  <script type="text/javascript" src="js.js"></script>
</body>
</html>
