export const handler = async (event: any) => {
    console.log('DynamoDB Event:' + JSON.stringify(event, null, 2));
}