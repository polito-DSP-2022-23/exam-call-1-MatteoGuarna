# Exam Call 1

The structure of this repository is the following:
  - "JSON Schemas" contains the design of the JSON Schemas;
  - "REST APIs Design" contains the full Open API documentation of the REST APIs, including examples of JSON documents to be used when invoking the operations;
  - "REST APIs Implementation" contains the code of the Film Manager service application.

<br />

*Inside each of the folders hereabove a README.md file can be found, which provides additional explanations for the folders and files there contained*

<br />


## Run th server in Windows

In order to correctly execute the program inside a Windows environment the following steps are required:

  - make sure both NPM and node.js are installed (both can be retrieved here https://nodejs.org/en/download/)
  - Open the terminal/command line/powershell
    - Change working directory the one corresponding to 'REST APIs Implementation'
    - Execute command 'npm install'
    - Execute command 'node index.js'

*now the server is running and can be accessed through the loopback interface on the port 3001, by using the link:*  http://localhost:3001  *followed by the API url*

</br>

## Test the server with Postman Collection:
 -  The "Postman collection.md" file contains an example of the APIs which require a body to run (available both as text and a Postman collection), which can be used in order to facilitate the testing phase


<br />