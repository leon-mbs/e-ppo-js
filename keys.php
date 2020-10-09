<?php
  
 $key  =  file_get_contents(__DIR__ . "/Key-6.dat") ;
 $cer  = file_get_contents(__DIR__. "/8030938.cer") ;
 
 $answer = array();
 $answer['key'] = base64_encode($key);
 $answer['cer'] = base64_encode($cer);
 $answer['pass'] = "tectfom";
 
 $json = json_encode($answer);
 
 header("Content-type: application/json");
 echo $json;