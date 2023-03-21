<?php
// header('Content-Type: text/plain');
$db_host = "localhost";
$db_user = "root";
$db_password = "TecHeres3141";

// connection
$lnk = mysqli_connect($db_host, $db_user, $db_password);
if (!$lnk) {
	die("DB connection failed");
}

mysqli_select_db($lnk, "puzzlecamscores") or die("Failed to select puzzlecamscores db");
// First query

function getAllScores($lnk) {
	$difficulties = array('easy', 'medium', 'hard', 'insane');
	$scores = array();
	for ($diff = 0; $diff < count($difficulties); ++$diff) {
		$scores[$difficulties[$diff]] = getScoresByDifficulty($difficulties[$diff], $lnk);
	}
	return $scores;
}


function getScoresByDifficulty($difficulty, $lnk) {
	$raw_query = "SELECT NAME, TIME, DIFFICULTY FROM Scores where DIFFICULTY LIKE '".$difficulty."' ORDER BY TIME";

	$rs = mysqli_query($lnk, $raw_query);
	$result = array();

	if (mysqli_num_rows($rs) > 0) {
		while ($row = mysqli_fetch_assoc($rs)) {
			array_push($result, $row);
		}
	}
	return $result;
}

// echo json_encode($allScores);

// inserting new data

function insertNewScore($data, $lnk) {
	$query = "INSERT INTO Scores (NAME, TIME, DIFFICULTY) 
	VALUES ('".$data["name"]."', '".$data["time"]."', '".$data["difficulty"]."')";
	return mysqli_query($lnk, $query, );
}

$allScores = getAllScores($lnk);


// Working with GET requests

if (isset($_GET["info"])) {
	echo $_GET["info"];
	$info = json_decode($_GET["info"]);
	if (insertNewScore($info, $lnk)) {
		echo "Score inserted successfully";
	} else {
		echo "Error while insertion";
	}
} else {
	$data = getAllScores($lnk);
	echo json_encode($data);
}	

?>