// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace BlobInputBinding
{
    public static class BlobFunction
    {
        [Function(nameof(BlobFunction))]
        public static IActionResult Run(
            [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req,
            [BlobInput("test-samples-input/sample1.txt", Connection = "BlobStoreConnection")] string myBlob,
            FunctionContext context)
        {
            var logger = context.GetLogger("BlobFunction");
            logger.LogInformation("Input Item = {myBlob}", myBlob);

            return new OkObjectResult(myBlob);
        }
    }
}
