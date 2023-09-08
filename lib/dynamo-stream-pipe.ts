import {Construct} from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {DynamoEventSource} from "aws-cdk-lib/aws-lambda-event-sources";
import {CfnOutput} from "aws-cdk-lib";


export interface DynamoStreamPipeProps {
    table: dynamodb.Table;
    queue: sqs.Queue
}

export class DynamoStreamPipe extends Construct {
    constructor(scope: Construct, id: string, props: DynamoStreamPipeProps) {
        super(scope, id);

        const lambdaReadStream = new NodejsFunction(this, 'readStream', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'lambdas/ec2-trigger.function.ts',
            handler: 'handler'
        });

        props.table.grantReadWriteData(lambdaReadStream);
        lambdaReadStream.addEventSource(new DynamoEventSource(props.table, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 10,
            retryAttempts: 0
        }))
        new CfnOutput(this, 'DynamoDbTableName', {value: props.table.tableName});
        new CfnOutput(this, 'LambdaFunctionArn', {value: lambdaReadStream.functionArn});
    }

}