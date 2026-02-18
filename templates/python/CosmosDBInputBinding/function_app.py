import azure.functions as func
import logging

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


# The following example shows an Azure Cosmos DB input binding.
# The function reads a single document based on query parameters.
@app.route(route="cosmosinput", methods=["GET"])
@app.cosmos_db_input(
    arg_name="inputDocument",
    database_name="MyDatabase",
    collection_name="MyCollection",
    id="{Query.id}",
    partition_key="{Query.partitionKey}",
    connection_string_setting="MyAccount_COSMOSDB",
)
def test_function(
    req: func.HttpRequest,
    inputDocument: func.DocumentList,
) -> func.HttpResponse:
    # Get the first document from the input
    if not inputDocument:
        return func.HttpResponse("Document not found", status_code=404)
    doc = inputDocument[0]
    logging.info("Read document with id: %s", doc["id"])
    return func.HttpResponse(str(doc))
