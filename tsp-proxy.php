<?php
   
  $post =  file_get_contents('php://input'); 
  
 
 
  $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://acskidd.gov.ua/services/tsp/");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
         curl_setopt($ch,CURLOPT_HEADER , false);  
         curl_setopt($ch, CURLOPT_ENCODING , "");
        curl_setopt($ch,CURLOPT_VERBOSE , 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/tsp-request','Content-Length:'.strlen($post)));
         curl_setopt($ch, CURLOPT_USERAGENT, '1');
    
        $res = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $res = base64_encode($res) ; 
        $size = strlen($res);
        header('Content-Length: ' . $size);       
        echo($res);