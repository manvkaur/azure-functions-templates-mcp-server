import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';

const blobOutput = output.storageBlob({
    path: 'samples-workitems/output.txt',
    connection: 'BlobStore',
});

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const body = await request.text();
    context.extraOutputs.set(blobOutput, body);

    return {
        status: 201,
        body: 'Blob written successfully',
    };
}

app.http('httpTrigger1', {
    methods: ['POST'],
    authLevel: 'function',
    extraOutputs: [blobOutput],
    handler: httpTrigger1,
});
