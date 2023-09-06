import {APIGatewayEvent, APIGatewayProxyResult} from 'aws-lambda';
import {nanoid} from 'nanoid';
import {putItem} from "./db-client";
import {failure, success} from "../lib/response";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const id = nanoid()
    const requestBody = JSON.parse(event.body || "{}");

    const params = {
        TableName: process.env.UPLOAD_TABLE_NAME,
        Item: {
            id: {S: id},
            path: {S: requestBody.path},
            userInput: {S: requestBody.userInput}
        }
    };

    try {
        await putItem(params);
        return success(params.Item);
    } catch (e) {
        return failure({status: false, errors: e})
    }

};