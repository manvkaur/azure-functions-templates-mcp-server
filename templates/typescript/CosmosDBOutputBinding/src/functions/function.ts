import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';

const cosmosOutput = output.cosmosDB({
    databaseName: 'ToDoItems',
    collectionName: 'Items',
    connectionStringSetting: 'CosmosDBConnection',
    createIfNotExists: true,
});

interface ToDoDocument {
    id: string;
    description: string;
}

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const body = (await request.json()) as ToDoDocument;
    const newItem: ToDoDocument = {
        id: body.id,
        description: body.description,
    };

    context.extraOutputs.set(cosmosOutput, newItem);

    return {
        status: 201,
        body: `Created ToDo item with id=${newItem.id}`,
    };
}

app.http('httpTrigger1', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [cosmosOutput],
    handler: httpTrigger1,
});
