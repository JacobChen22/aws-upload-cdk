export function success(body: any) {
    return buildResponse(200, body);
}

export function failure(body: any) {
    return buildResponse(500, body);
}

function buildResponse(statusCode: number, body: any) {
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(body),
    };
}
