import {EC2Client, RunInstancesCommand, RunInstancesCommandInput} from "@aws-sdk/client-ec2";
import {CloudFormationClient, ListExportsCommand, ListExportsOutput} from "@aws-sdk/client-cloudformation";

export const handler = async (event: any) => {
    const newInputId = event.Records[0].dynamodb.NewImage.id.S;
    const cfClient = new CloudFormationClient();

    const response: ListExportsOutput = await cfClient.send(new ListExportsCommand({}))
    const keyName = response.Exports?.find(item => item.Name === 'Ec2InstanceKey')?.Value;
    const dynamoDbTableName = response.Exports?.find(item => item.Name === 'DynamoDbTableName')?.Value;
    const subnetId = response.Exports?.find(item => item.Name === 'SubnetIds')?.Value?.split(',')[0];
    const ec2SecurityGroupId = response.Exports?.find(item => item.Name === 'Ec2SecurityGroupId')?.Value;
    const ec2IamProfile = response.Exports?.find(item => item.Name === 'Ec2IamProfile')?.Value;
    console.log(dynamoDbTableName);
    const userData = `#!/bin/bash

dynamo_result=$(aws dynamodb query \
  --table-name "${dynamoDbTableName}" \
  --key-condition-expression "id = :val" \
  --expression-attribute-values '{":val": {"S": "'"${newInputId}"'"}}' \
  --output json)

path=$(echo "$dynamo_result" | jq -r '.Items[0].path.S')
userInput=$(echo "$dynamo_result" | jq -r '.Items[0].userInput.S')

aws s3 cp "s3://upload-file-demo-public/$path" "$userInput"
aws s3 mv "$userInput" "s3://ec2-conversed-object-bucket/$userInput"

shutdown -h now`;

    const base64UserData = Buffer.from(userData).toString('base64');

    const input: RunInstancesCommandInput = {
        MaxCount: 1,
        MinCount: 1,
        InstanceType: "t2.micro",
        ImageId: 'ami-00a9282ce3b5ddfb1',
        UserData: base64UserData,
        KeyName: keyName,
        SubnetId: subnetId,
        IamInstanceProfile: {Arn: ec2IamProfile},
        SecurityGroupIds: [ec2SecurityGroupId || ''],
        InstanceInitiatedShutdownBehavior: "terminate"
    }

    // 还需要从cloudFormation里面获取一些信息：VPC, SG, IAM, KEY-PAIR
    const command = new RunInstancesCommand(input);
    const client = new EC2Client();
    const ec2Response = await client.send(command);

}