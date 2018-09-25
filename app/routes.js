var azure = require('azure-storage');
var uuid = require('uuid');

var value = process.env.CUSTOMCONNSTR_MS_AzureStorageAccountConnectionString;

var str = value.split(";")
var AccountName = str[1].split("=")[1];
var AccountKey = str[2].split("=")[1]+"==";

var tableName = "tasks"
  , partitionKey = "mytasks"
  , accountName = AccountName
  , accountKey = AccountKey;


console.log("create table service");

var tableService = azure.createTableService(accountName, accountKey);

console.log("create table");

tableService.createTableIfNotExists(tableName, function(error, result, response) {
  if (!error) {
    // result contains true if created; false if already exists
    console.log(result);
  }
});

function getTasks(res) {

    console.log("start get tasks");

    var query = new azure.TableQuery()
       .top(10)
       .where('PartitionKey eq ?', partitionKey);

    tableService.queryEntities(tableName, query, null, function(error, result, response) {
      if (error) {
        console.log("start get tasks - ERROR");
        res.send(err);
        }
      if (!error) {
         // result.entries contains entities matching the query
         console.log("start get tasks - RESULT");
         console.log(result);
         console.log("start get tasks - ETNRIES ONLY");
         console.log(result.entries);
         res.json(result.entries);
      }
});
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', function (req, res) {
        console.log("app.get");
        // use mongoose to get all todos in the database
        getTasks(res);
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function (req, res) {
        console.log("app.post");

        var entGen = azure.TableUtilities.entityGenerator;
        var entity = {
            PartitionKey: entGen.String(partitionKey),
            RowKey: entGen.String(uuid()),
            text: entGen.String(req.body.text),
          done: entGen.Boolean(false)
        };
        tableService.insertEntity(tableName, entity, function(error, result, response) {
            console.log("result");
            console.log(result);
            console.log("response");
            console.log(response);

            if (error) {
                // result contains the ETag for the new entity
                console.log("app.post error");
            }
                if (!error) {
            // result contains the ETag for the new entity
            console.log("app.post successfull");
        }
        getTasks(res);
    });
});

    // delete a todo

    app.delete('/api/todos/:todo_id', function (req, res) {
        console.log("delete");
        console.log(req.params.todo_id);

        var entGen = azure.TableUtilities.entityGenerator;
        var entity = {
            PartitionKey: entGen.String(partitionKey),
            RowKey: entGen.String(req.params.todo_id),
        };        
          
        tableService.deleteEntity(tableName, entity, function(error, response){

            if (error) {
                // result contains the ETag for the new entity
                console.log("app.delete error");
            }
                if (!error) {
            // result contains the ETag for the new entity
            console.log("app.delete successfull");
        }
        getTasks(res);

          });
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};

