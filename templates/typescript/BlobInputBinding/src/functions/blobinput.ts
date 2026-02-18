import { app, HttpRequest, HttpResponseInit, input, InvocationContext } from '@azure/functions';

const blobInput = input.storageBlob({
    path: 'samples-workitems/{Query.file}',
    connection: 'BlobStore',
});

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const blobContent = context.extraInputs.get(blobInput);
    context.log(`Blob content: ${blobContent}`);

    return {
        body: `Blob content: ${blobContent}`,
    };
}

app.http('httpTrigger1', {
    methods: ['GET'],
    authLevel: 'function',
    extraInputs: [blobInput],
    handler: httpTrigger1,
});
