// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace BlobOutputBinding
{
    public static class BlobFunction
    {
        [Function(nameof(BlobFunction))]
        [BlobOutput("test-samples-output/output.txt", Connection = "BlobStoreConnection")]
        public static string Run(
            [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req,
            FunctionContext context)
        {
            var logger = context.GetLogger("BlobFunction");
            logger.LogInformation("Writing blob output");

            // Blob Output
            return "blob-output content";
        }
    }
}
