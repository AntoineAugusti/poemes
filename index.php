<?
require "functions.php";

$signature = $_GET['signature'];
$themes = explode("\n", file_get_contents($THEMES_FILENAME));
$themes = array_map(function ($x) { $array = explode(';', $x); sort($array); return $array;}, $themes);
$poemes = array_reverse(explode("===", file_get_contents($POEME_FILENAME)), true);
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
  <link href="https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&family=Vollkorn:wght@700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" integrity="sha512-c42qTSw/wPZ3/5LBzD+Bw5f7bSF2oxou6wEb+I/lqeaKV5FDIfMvvRp772y4jcJLKuGUOpbJMdg/BTl50fJYAw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link rel="stylesheet" href="reset.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <? if (empty($signature)) { ?>
      <div class="search_wrapper">
        <div class="up-down" tabindex="0" role="button">
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMCAxNi42N2wyLjgyOSAyLjgzIDkuMTc1LTkuMzM5IDkuMTY3IDkuMzM5IDIuODI5LTIuODMtMTEuOTk2LTEyLjE3eiIvPjwvc3ZnPg==">
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMCA3LjMzbDIuODI5LTIuODMgOS4xNzUgOS4zMzkgOS4xNjctOS4zMzkgMi44MjkgMi44My0xMS45OTYgMTIuMTd6Ii8+PC9zdmc+">
        </div>
        <input type="search" id="search" list="themes-list">
        <?php if ($_SERVER['PHP_AUTH_USER'] == "augusti" || $_SERVER['HTTP_HOST'] == 'localhost:8080') { ?>
          <div class="add">
            <a href="add.php">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0xMS41IDBjNi4zNDcgMCAxMS41IDUuMTUzIDExLjUgMTEuNXMtNS4xNTMgMTEuNS0xMS41IDExLjUtMTEuNS01LjE1My0xMS41LTExLjUgNS4xNTMtMTEuNSAxMS41LTExLjV6bTAgMWM1Ljc5NSAwIDEwLjUgNC43MDUgMTAuNSAxMC41cy00LjcwNSAxMC41LTEwLjUgMTAuNS0xMC41LTQuNzA1LTEwLjUtMTAuNSA0LjcwNS0xMC41IDEwLjUtMTAuNXptLjUgMTBoNnYxaC02djZoLTF2LTZoLTZ2LTFoNnYtNmgxdjZ6Ii8+PC9zdmc+">
            </a>
          </div>
          <?php } ?>
        <div id="nb-results"></div>
        <datalist id="themes-list">
          <? foreach(allThemes($THEMES_FILENAME) as $theme) { ?>
            <option value="<?= $theme ?>"></option>
          <? } ?>
        </datalist>
        <div class="days">
          <?php frequencies($poemes); ?>
        </div>
        <details>
          <summary>
            Thèmes
          </summary>
          <div class="poeme">
            <? foreach(countThemes($THEMES_FILENAME) as $theme => $count) { ?>
              <a class="theme" href="##<?= $theme ?>">
                <span class="hashtag">#</span><?= $theme ?>&nbsp;<span class="count"><?= $count ?></span>
              </a>
            <? } ?>
          </div>
        </details>
      </div>
    <? } ?>
    <div class="rows">
      <div class="left">
        <div class="poeme-titles">
          <?
          foreach ($poemes as $i => $poeme) {
            $i = $i + 1;
            $matches = parsePoeme($poeme);
            if (! empty($matches["titre"])) { ?>
              <span
                class="poeme-title hidden"
                tabindex="0"
                role="switch"
                data-id="<?= $i ?>"
                <? if (! empty($matches["lang"])) { ?>
                  lang="<?= $matches["lang"] ?>"
                <? } ?>
              ><?= $matches["titre"]; ?></span>
            <? }
          } ?>
          <img id="reset-poeme-titles" class="hidden" tabindex="0" role="button" src="data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTEuOTk4IDJjNS41MTcgMCA5Ljk5NyA0LjQ4IDkuOTk3IDkuOTk4IDAgNS41MTctNC40OCA5Ljk5Ny05Ljk5NyA5Ljk5Ny01LjUxOCAwLTkuOTk4LTQuNDgtOS45OTgtOS45OTcgMC01LjUxOCA0LjQ4LTkuOTk4IDkuOTk4LTkuOTk4em0tNi41MTUgNC41NDRjLTEuMjM3IDEuNDc2LTEuOTgzIDMuMzc4LTEuOTgzIDUuNDU0IDAgNC42OSAzLjgwOCA4LjQ5NyA4LjQ5OCA4LjQ5NyAyLjA3NSAwIDMuOTc3LS43NDUgNS40NTQtMS45ODN6bTEzLjAyOSAxMC45MDhjMS4yMzgtMS40NzcgMS45ODMtMy4zNzkgMS45ODMtNS40NTQgMC00LjY5LTMuODA3LTguNDk4LTguNDk3LTguNDk4LTIuMDc2IDAtMy45NzguNzQ2LTUuNDU0IDEuOTgzeiIgZmlsbD0iI0Y1RjVGNSIvPjwvc3ZnPg==">
        </div>
      </div>
      <div class="poemes-container">
        <?
        foreach ($poemes as $i => $poeme) {
          $i = $i + 1;
          $poeme_signature = md5($poeme);
          $matches = parsePoeme($poeme);
          ?>
          <div
            class="poeme-container"
            id="poeme-<?= $i ?>"
            <? if (! empty($matches["lang"])) { ?>
              lang="<?= $matches["lang"] ?>"
            <? } ?>
            >
            <div class="poeme visible" data-id="<?= $i ?>">
              <a class="id" href="#<?= $i ?>">
                <?= $i ?>
              </a>
              <div class="js-poeme-search">
                <div class="poeme-content">
                  <?
                  if (empty($signature) or $signature == $poeme_signature) {
                    if (! empty($matches["titre"])) { ?>
                      <div class="poeme-title"><?= $matches["titre"]; ?></div>
                    <? }
                    if (! empty($matches["date"])) { ?>
                      <div class="poeme-date">
                        <a href="#<?= substr($matches["date"], 0, 7) ?>"><?= substr($matches["date"], 0, 7) ?></a><?= substr($matches["date"], 7) ?>
                      </div>
                    <? } ?>
                    <div class="poeme-text">
                      <? if (! empty($matches["titre"])) { ?>
                        <div class="to_show">## <?= $matches["titre"]; ?></div>
                      <? } ?>
                      <?= nl2br(trim($matches["poeme"])); ?>
                    </div>
                  <? } ?>
                </div>
                <div class="themes">
                  <? foreach ($themes[$i-1] as $theme) { ?>
                    <a class="theme" href="##<?= $theme ?>">
                      <span class="hashtag">#</span><?= $theme ?>
                    </a>
                  <? } ?>
                </div>
              </div>
              <? if (! empty($matches["notes"])) { ?>
                <div class="action-button js-notes-auteur">
                  <img src="data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTEuMjUgNmMuMzk4IDAgLjc1LjM1Mi43NS43NSAwIC40MTQtLjMzNi43NS0uNzUuNzUtMS41MDUgMC03Ljc1IDAtNy43NSAwdjEyaDE3di04Ljc1YzAtLjQxNC4zMzYtLjc1Ljc1LS43NXMuNzUuMzM2Ljc1Ljc1djkuMjVjMCAuNjIxLS41MjIgMS0xIDFoLTE4Yy0uNDggMC0xLS4zNzktMS0xdi0xM2MwLS40ODEuMzgtMSAxLTF6bS0yLjAxMSA2LjUyNmMtMS4wNDUgMy4wMDMtMS4yMzggMy40NS0xLjIzOCAzLjg0IDAgLjQ0MS4zODUuNjI2LjYyNy42MjYuMjcyIDAgMS4xMDgtLjMwMSAzLjgyOS0xLjI0OXptLjg4OC0uODg5IDMuMjIgMy4yMiA4LjQwOC04LjRjLjE2My0uMTYzLjI0NS0uMzc3LjI0NS0uNTkyIDAtLjIxMy0uMDgyLS40MjctLjI0NS0uNTkxLS41OC0uNTc4LTEuNDU4LTEuNDU3LTIuMDM5LTIuMDM2LS4xNjMtLjE2My0uMzc3LS4yNDUtLjU5MS0uMjQ1LS4yMTMgMC0uNDI4LjA4Mi0uNTkyLjI0NXoiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==">
                  Notes de l'auteur
                </div>
              <? } ?>
              <div class="action-button js-copy-button">
                <img src="data:image/svg+xml;base64,PHN2ZyBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNiAxOGgtM2MtLjQ4IDAtMS0uMzc5LTEtMXYtMTRjMC0uNDgxLjM4LTEgMS0xaDE0Yy42MjEgMCAxIC41MjIgMSAxdjNoM2MuNjIxIDAgMSAuNTIyIDEgMXYxNGMwIC42MjEtLjUyMiAxLTEgMWgtMTRjLS40OCAwLTEtLjM3OS0xLTF6bTEuNS0xMC41djEzaDEzdi0xM3ptOS0xLjV2LTIuNWgtMTN2MTNoMi41di05LjVjMC0uNDgxLjM4LTEgMS0xeiIgZmlsbC1ydWxlPSJub256ZXJvIi8+PC9zdmc+">
                Copier
              </div>
              <div class="action-button js-share-button">
                <span class="hidden js-share-url">https://poemes.antoine-augusti.fr/share?signature=<?= $poeme_signature; ?>#<?= $i; ?></span>
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNiAxN2MyLjI2OS05Ljg4MSAxMS0xMS42NjcgMTEtMTEuNjY3di0zLjMzM2w3IDYuNjM3LTcgNi42OTZ2LTMuMzMzcy02LjE3LS4xNzEtMTEgNXptMTIgLjE0NXYyLjg1NWgtMTZ2LTEyaDYuNTk4Yy43NjgtLjc4NyAxLjU2MS0xLjQ0OSAyLjMzOS0yaC0xMC45Mzd2MTZoMjB2LTYuNzY5bC0yIDEuOTE0eiIvPjwvc3ZnPg==">
                Partager
              </div>
              <? if (! empty($matches["notes"])) { ?>
                <div class="poeme-notes hidden">
                  <?= $matches["notes"]; ?>
                </div>
              <? } ?>
            </div>
          </div>
        <? } ?>
      </div>
    </div>

  </div>
  <script type="text/javascript" src="js.js"></script>
</body>
</html>
