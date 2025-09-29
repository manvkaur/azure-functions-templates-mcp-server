package com.example;

import com.google.gson.*;
import com.microsoft.azure.functions.*;
import com.microsoft.azure.functions.annotation.*;

public class Snippets {
    private static final String BLOB_PATH = "snippets/%s.txt";
    private static final String SAVE_SNIPPET_ARGUMENTS = "[{\"propertyName\":\"snippetName\",\"propertyType\":\"string\",\"description\":\"Name of the snippet\"},{\"propertyName\":\"snippet\",\"propertyType\":\"string\",\"description\":\"Snippet content\"}]";
    private static final String GET_SNIPPET_ARGUMENTS = "[{\"propertyName\":\"snippetName\",\"propertyType\":\"string\",\"description\":\"Name of the snippet\"}]";
    @StorageAccount("AzureWebJobsStorage")
    public void saveSnippet(
            @McpToolTrigger(
                    toolName = "saveSnippets",
                    description = "Saves a text snippet to your snippets collection.",
                    toolProperties = SAVE_SNIPPET_ARGUMENTS
            ) String toolArguments,
            @BlobOutput(name = "outputBlob", path = "snippets/{snippetName}.txt") OutputBinding<String> outputBlob,
            final ExecutionContext context) {
        context.getLogger().info(toolArguments);
        JsonObject args = JsonParser.parseString(toolArguments).getAsJsonObject().getAsJsonObject("arguments");
        String snippetName = args.get("snippetName").getAsString();
        String snippet = args.get("snippet").getAsString();
        context.getLogger().info("Saving snippet: " + snippetName);
        outputBlob.setValue(snippet);
    }

    @FunctionName("GetSnippets")
    @StorageAccount("AzureWebJobsStorage")
    public void getSnippet(
            @McpToolTrigger(
                    toolName = "getSnippets",
                    description = "Gets a text snippet from your snippets collection.",
                    toolProperties = GET_SNIPPET_ARGUMENTS
            ) String toolArguments,
            @BlobInput(name = "inputBlob", path = "snippets/{snippetName}.txt") String inputBlob,
            final ExecutionContext context) {
        context.getLogger().info(toolArguments);
        JsonObject args = JsonParser.parseString(toolArguments).getAsJsonObject().getAsJsonObject("arguments");
        String snippetName = args.get("snippetName").getAsString();
        context.getLogger().info("Retrieving snippet: " + snippetName);
        context.getLogger().info(inputBlob);
    }
}
