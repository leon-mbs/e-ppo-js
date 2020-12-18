<?php
   
   
   
 
   $post =  file_get_contents('php://input'); 
  
   $post = base64_decode($post) ;
   $type = $_REQUEST['type']   ;
   $request = curl_init();
 
    
            curl_setopt_array($request, [
                CURLOPT_URL            => "http://80.91.165.208:8609/fs/{$type}",
                CURLOPT_POST           => true,
                CURLOPT_HEADER         => false,
                CURLOPT_HTTPHEADER     => array('Content-Type: application/octet-stream', "Content-Length: " . strlen($post)),
                CURLOPT_ENCODING       => "",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 20,
                CURLOPT_VERBOSE        => 1,
                CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
                CURLOPT_POSTFIELDS     => $post
            ]);    
    
    
        $res = curl_exec($request);
     
        curl_close($request);
     //  $res = mb_convert_encoding($res , "utf-8", "windows-1251" )  ;  
                        
        // $res = base64_encode($res) ; 
        $size = strlen($res);
        header('Content-Length: ' . $size);       
        echo($res);