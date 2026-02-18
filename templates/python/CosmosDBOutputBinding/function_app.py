import azure.functions as func
import logging

app = func.FunctionApp()


# The following example shows an Azure Cosmos DB output binding.
# The function writes a new document to Cosmos DB from an HTTP request.
@app.route(route="cosmosoutput", auth_level=func.AuthLevel.ANONYMOUS)
@app.cosmos_db_output(
    arg_name="outputDocument",
    database_name="MyDatabase",
    collection_name="MyCollection",
    connection_string_setting="MyAccount_COSMOSDB",
)
def test_function(
    req: func.HttpRequest,
    outputDocument: func.Out[func.Document],
):
    request_body = req.get_json()
    outputDocument.set(func.Document.from_dict(request_body))
    return "Document created successfully."
