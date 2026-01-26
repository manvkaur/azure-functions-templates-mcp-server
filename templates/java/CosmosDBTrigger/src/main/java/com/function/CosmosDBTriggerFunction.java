package com.function;

import com.microsoft.azure.functions.ExecutionContext;
import com.microsoft.azure.functions.HttpMethod;
import com.microsoft.azure.functions.HttpRequestMessage;
import com.microsoft.azure.functions.HttpResponseMessage;
import com.microsoft.azure.functions.HttpStatus;
import com.microsoft.azure.functions.annotation.CosmosDBInput;
import com.microsoft.azure.functions.annotation.FunctionName;
import com.microsoft.azure.functions.annotation.HttpTrigger;

import java.util.Optional;

public class CosmosDBTriggerFunction {

    @FunctionName("CosmosDBTriggerFunction")
    public void run(
        @CosmosDBTrigger(
            name = "items",
            databaseName = "ToDoList",
            containerName = "Items",
            leaseContainerName="leases",
            connection = "CosmosDbConnection",
            createLeaseContainerIfNotExists = true
        )
        Object inputItem,
        final ExecutionContext context
    ) {
        context.getLogger().info("Items modified: " + inputItems.size());
    }
}
