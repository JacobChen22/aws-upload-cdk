import {
    DeleteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

export const getDynamoDbClient = () => new DynamoDBClient();

export const putItem = async (params: any) =>
    getDynamoDbClient().send(new PutItemCommand(params));

export const getItem = async (params: any) =>
    getDynamoDbClient().send(new GetItemCommand(params));

export const deleteItem = async (params: any) =>
    getDynamoDbClient().send(new DeleteItemCommand(params));

export const updateItem = async (params: any) =>
    getDynamoDbClient().send(new UpdateItemCommand(params));