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
    }
  }

  $period = new DatePeriod(
    $startDate,
    new DateInterval('P1D'),
    $endDate->modify('+1 day')
  );

  foreach($period as $date) {
    $dateString = $date->format('Y-m-d H:i:s');
    $month = $date->format('Y-m');
    $day = $date->format('Y-m-d');
    if (isset($dates[$dateString])) {
      echo "<a class='day visible' data-day='".$day."' title=".$day." href='#".$day."' style='height: ".(15*$dates[$dateString])."px'></a>";
    } else {
      echo "<a class='day' data-day='".$day."'></a>";
    }
  }
}
