using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace CosmosDBInputBinding;

public class CosmosDBInputBinding
{
    private readonly ILogger<CosmosDBInputBinding> _logger;

    public CosmosDBInputBinding(ILogger<CosmosDBInputBinding> logger)
    {
        _logger = logger;
    }

    [Function(nameof(DocByIdFromJSON))]
    public IActionResult DocByIdFromJSON(
    [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req,
    [CosmosDBInput(
        databaseName: "ToDoItems",
        containerName: "Items",
        Connection  = "CosmosDbConnection",
        Id = "{Query.id}",
        PartitionKey = "{Query.partitionKey}")] ToDoItem toDoItem)
    {
        if (toDoItem == null)
        {
            _logger.LogInformation("ToDo item not found");
            return new NotFoundResult();
        }
        else
        {
            _logger.LogInformation($"Found ToDo item, Description={toDoItem.Description}");
            return new OkObjectResult(toDoItem);
        }
    }
}