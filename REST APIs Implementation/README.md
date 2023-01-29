## REST APIs Implementation

*This folder contains the code of the Film Manager service application, inside the following folders and files*

</br>

  -  ### api:
     -  Contains the OpenAPI documentation in yaml format, which is available on http://localhost:3001/docs (server must be run in order to retrieve it)

</br>

  -  ### components:
     -  Contains the constructors of the main ojects required by the service (user,film,review,draft,response)
     -  Contains the DB constructor
     -  Contains a sort-of constructor which authomatically generates the date for the operations which require a date to be set

</br>

  -  ### controllers:
     -  Contains the server API handlers, which are called by the server service and rely on the "service" functions

</br>

  -  ### service:
     -  Contains the function which perform the SQL queries to the DB and process the data, generating the output

</br>

  -  ### json_schemas:
     -  Contains the JSON schemas used to validate the body of the functions which require it (they do not correspond to the "conceptual" schemas reported in the JSON Schemas folder inside the parent directory)

</br>

  -  ### index.js:
     -  The file containing the server service, which can be run by following the instructions contained in the README.md inside the parent directory

</br>


  