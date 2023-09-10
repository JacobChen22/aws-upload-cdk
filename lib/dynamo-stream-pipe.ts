import {Construct} from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
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

        const readStreamLambdaRole = new iam.Role(this, 'readStreamLambdaRole', {
            roleName: 'lambda-read-stream-role',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationReadOnlyAccess')
            ]
        })
        const passRoleCustomStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'iam:PassRole'
            ],
            resources: ['arn:aws:iam::*:role/*'],
        });
        readStreamLambdaRole.addToPolicy(passRoleCustomStatement);
        const runEc2CustomStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ec2:RunInstances'
            ],
            resources: ['*']
        });
        readStreamLambdaRole.addToPolicy(runEc2CustomStatement);
        const lambdaReadStream = new NodejsFunction(this, 'readStream', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'lambdas/ec2-trigger.function.ts',
            handler: 'handler',
            role: readStreamLambdaRole
        });


        props.table.grantReadWriteData(lambdaReadStream);
        lambdaReadStream.addEventSource(new DynamoEventSource(props.table, {
            startingPosition: lambda.StartingPosition.LATEST,
            batchSize: 10,
            retryAttempts: 0
        }))

        new CfnOutput(this, 'LambdaFunctionArn', {value: lambdaReadStream.functionArn});
    }

}