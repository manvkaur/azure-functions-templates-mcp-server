using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace SampleApp
{
    public class CosmosDBFunction
    {
        private readonly ILogger<CosmosDBFunction> _logger;

        public CosmosDBFunction(ILogger<CosmosDBFunction> logger)
        {
            _logger = logger;
        }

        [Function(nameof(CosmosDBFunction))]
        [CosmosDBOutput("%CosmosDb%", "%CosmosContainerOut%", Connection = "CosmosDBConnection", CreateIfNotExists = true)]
        public object? Run(
            [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req,
            FunctionContext context)
        {
            var requestBody = new StreamReader(req.Body).ReadToEndAsync().Result;
            if (!string.IsNullOrEmpty(requestBody))
            {
                _logger.LogInformation("Writing document to Cosmos DB");
                return new { id = Guid.NewGuid().ToString(), text = requestBody };
            }

            return null;
        }
    }
}