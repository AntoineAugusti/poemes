<?php
session_start();

$_SESSION['mode'] = $_GET['mode'] ?? $_SESSION['mode'] ?? 'poemes';

if ($_SESSION['mode'] == 'poemes') {
  $THEMES_FILENAME = "themes-poemes.txt";
  $TEXTES_FILENAME = "poemes.txt";

  if (getenv("NODE_ENV") == "test") {
    $THEMES_FILENAME = "themes.test.txt";
    $TEXTES_FILENAME = "poemes.test.txt";
  }
} else {
  $THEMES_FILENAME = "themes-textes.txt";
  $TEXTES_FILENAME = "textes.txt";
}


function flatten(array $array) {
  $return = array();
  array_walk_recursive($array, function($a) use (&$return) { $return[] = $a; });
  sort($return);
  return $return;
}

function validSignature($poemes, $signature) {
  $hashes = array_map(function ($poeme) { return md5($poeme);}, $poemes );
  return in_array($signature, $hashes);
}

function parsePoeme($poeme) {
  $poeme_content = trim($poeme);
  $re = '~(?:---(?<notes>(?:.|\n)*)---)?(?:\n*(?<date>\d{4}-\d{2}-\d{2}))?\n*(?:lang: (?<lang>[a-z]{2}))?\n*(?:## (?<titre>.*))?(?<poeme>(?:.|\n)*)~';
  preg_match($re, $poeme_content, $matches);
  return $matches;
}

function allThemes($themesFilename) {
  $themes = explode("\n", file_get_contents($themesFilename));
  $themes = flatten(array_map(function ($x) { $array = explode(';', $x); sort($array); return $array;}, $themes));
  $themes = array_filter($themes, function($x) { return $x !== ""; });
  return array_values(array_unique($themes));
}

function countThemes($themesFilename) {
  $themes = explode("\n", file_get_contents($themesFilename));
  $themes = array_map(function ($x) { $array = explode(';', $x); sort($array); return $array;}, $themes);
  $themes = array_filter(flatten($themes), function($x) { return $x !== ""; });
  $countThemes = array_count_values($themes);
  arsort($countThemes);
  return $countThemes;
}

function commonThemes($themesFilename) {
  $result = [];
  $lines = explode("\n", file_get_contents($themesFilename));
  foreach ($lines as $line) {
    $themes = explode(";", $line);
    foreach ($themes as $theme1) {
      foreach ($themes as $theme2) {
        if ($theme1 != $theme2 and ($result[$theme1] == null or !in_array($theme2, $result[$theme1]))) {
          $result[$theme1][] = $theme2;
        }
      }
    }
  }
  return $result;
}

function frequencies($poemes) {
  $startDate = null;
  $endDate = null;
  $dates = [];
  $maxCount = 1;

  foreach ($poemes as $poeme) {
    $matches = parsePoeme($poeme);
    if (!empty($matches['date'])) {
      $date = $matches['date'].' 00:00:00';
      if (empty($endDate)) {
        $endDate = new DateTime($date);
      }
      $startDate = new DateTime($date);

      if (isset($dates[$date])) {
        $dates[$date]++;
      } else {
        $dates[$date] = 1;
      }
      if ($dates[$date] > $maxCount) {
        $maxCount = $dates[$date];
      }
    }
  }

  // Ajuster startDate pour commencer un lundi
  $dayOfWeek = (int)$startDate->format('N'); // 1=lundi, 7=dimanche
  if ($dayOfWeek > 1) {
    $startDate->modify('-'.($dayOfWeek - 1).' days');
  }

  // Ajuster endDate pour finir un dimanche
  $dayOfWeek = (int)$endDate->format('N');
  if ($dayOfWeek < 7) {
    $endDate->modify('+'.(7 - $dayOfWeek).' days');
  }

  $period = new DatePeriod(
    $startDate,
    new DateInterval('P1D'),
    $endDate->modify('+1 day')
  );

  // Organiser les jours par semaine
  $weeks = [];
  $currentWeek = [];
  foreach($period as $date) {
    $dateString = $date->format('Y-m-d H:i:s');
    $day = $date->format('Y-m-d');
    $dayOfWeek = (int)$date->format('N');
    $count = isset($dates[$dateString]) ? $dates[$dateString] : 0;

    // Calculer le niveau (0-4) basé sur le nombre de poèmes
    $level = 0;
    if ($count > 0) {
      $level = min(4, ceil($count / max(1, $maxCount / 4)));
    }

    $currentWeek[] = [
      'day' => $day,
      'count' => $count,
      'level' => $level
    ];

    if ($dayOfWeek === 7) {
      $weeks[] = $currentWeek;
      $currentWeek = [];
    }
  }

  // Générer le HTML de la grille
  echo "<div class='days-grid'>";
  foreach ($weeks as $week) {
    echo "<div class='days-week'>";
    foreach ($week as $dayData) {
      $classes = 'day level-'.$dayData['level'];
      if ($dayData['count'] > 0) {
        $classes .= ' visible';
        echo "<a class='".$classes."' tabindex='-1' data-day='".$dayData['day']."' data-count='".$dayData['count']."' title='".$dayData['day']." (".$dayData['count'].")' href='#".$dayData['day']."'></a>";
      } else {
        echo "<span class='".$classes."' data-day='".$dayData['day']."'></span>";
      }
    }
    echo "</div>";
  }
  echo "</div>";
}
