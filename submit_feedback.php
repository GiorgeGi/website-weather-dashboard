<?php
    // Retrieve form data using the POST method
    $nickname = $_POST['nickname'];               // Get the nickname from the form
    $ease_of_use = $_POST['ease_of_use'];           // Get the ease of use feedback from the form
    $usefulness = $_POST['usefulness'];            // Get the usefulness feedback from the form
    $cat_annoying = $_POST['cat_annoying'];        // Get the crumb cat feedback from the form
    $extra_comments = $_POST['extra_comments'];    // Get any additional comments from the form

    // Establish a connection to the MySQL database
    $conn = new mysqli('localhost','root','','weather_dashboard');
    
    // Check if there was a connection error
    if($conn->connect_error){
        echo "$conn->connect_error";    // Output the connection error
        die("Connection Failed : ". $conn->connect_error);  // Terminate the script on connection failure
    } else {
        // Prepare an SQL statement to insert the feedback data into the database
        $stmt = $conn->prepare("insert into feedback(nickname, ease_of_use, usefulness, cat_annoying, extra_comments) values(?, ?, ?, ?, ?)");
        
        // Bind the input parameters to the prepared statement
        $stmt->bind_param("sssss", $nickname, $ease_of_use, $usefulness, $cat_annoying, $extra_comments); 
        
        // Execute the prepared statement
        $execval = $stmt->execute();
        
        // Output the result of the execution (should be true if successful)
        echo $execval;  
        
        // Output a success message
        echo "Registration successfully..."; 
        
        // Close the prepared statement and the database connection
        $stmt->close();  
        $conn->close();  
    }
?>
