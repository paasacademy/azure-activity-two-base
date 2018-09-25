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

var tableService = azure.createTableService(accountName, accountKey);

tableService.createTableIfNotExists(tableName, function(error, result, response) {
  if (!error) {
    // result contains true if created; false if already exists
  }
});

function getTasks(res) {

    var query = new azure.TableQuery()
       .top(10)
       .where('PartitionKey eq ?', partitionKey);

    tableService.queryEntities(tableName, query, null, function(error, result, response) {
      if (error) {
        res.send(err);
        }
      if (!error) {
         // result.entries contains entities matching the query
         res.json(result.entries);
      }
});
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', function (req, res) {
        // use mongoose to get all todos in the database
        getTasks(res);
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function (req, res) {

        var entGen = azure.TableUtilities.entityGenerator;
        var entity = {
            PartitionKey: entGen.String(partitionKey),
            RowKey: entGen.String(uuid()),
            text: entGen.String(req.body.text),
          done: entGen.Boolean(false)
        };
        tableService.insertEntity(tableName, entity, function(error, result, response) {

            if (error) {
                // result contains the ETag for the new entity
            }
                if (!error) {
            // result contains the ETag for the new entity
        }
        getTasks(res);
    });
});

    // delete a todo

    app.delete('/api/todos/:todo_id', function (req, res) {

        var entGen = azure.TableUtilities.entityGenerator;
        var entity = {
            PartitionKey: entGen.String(partitionKey),
            RowKey: entGen.String(req.params.todo_id),
        };        
          
        tableService.deleteEntity(tableName, entity, function(error, response){

            if (error) {
                // result contains the ETag for the new entity
            }
                if (!error) {
            // result contains the ETag for the new entity
        }
        getTasks(res);

          });
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};

