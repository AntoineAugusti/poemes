<?php

require "functions.php";

$poemes = array_reverse(explode("===", file_get_contents($POEME_FILENAME)), true);

$data = [];
foreach ($poemes as $poeme) {
	$matches = parsePoeme($poeme);
	$line = [
		'titre' => $matches['titre'],
		'date' => $matches['date'],
		'poeme' => trim($matches['poeme']),
	];
	$data[] = $line;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);