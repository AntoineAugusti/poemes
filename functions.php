<?php

function flatten(array $array) {
  $return = array();
  array_walk_recursive($array, function($a) use (&$return) { $return[] = $a; });
  sort($return);
  return $return;
}

function parsePoeme($poeme) {
  $poeme_content = trim($poeme);
  $re = '~(?:---(?<notes>(?:.|\n)*)---)?(?:\n*(?<date>\d{4}-\d{2}-\d{2}))?\n*(?:## (?<titre>.*))?(?<poeme>(?:.|\n)*)~';
  preg_match($re, $poeme_content, $matches);
  return $matches;
}

function allThemes() {
	$themes = explode("\n", file_get_contents("themes.txt"));
	$themes = flatten(array_map(function ($x) { $array = explode(';', $x); sort($array); return $array;}, $themes));
	$themes = array_filter($themes, function($x) { return $x !== ""; });
	return array_values(array_unique($themes));
}

function countThemes() {
	$themes = explode("\n", file_get_contents("themes.txt"));
	$themes = array_map(function ($x) { $array = explode(';', $x); sort($array); return $array;}, $themes);
	$countThemes = array_count_values(flatten($themes));
	arsort($countThemes);
	return $countThemes;
}

function commonThemes() {
	$result = [];
	$lines = explode("\n", file_get_contents("themes.txt"));
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
