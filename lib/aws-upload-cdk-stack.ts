import * as cdk from 'aws-cdk-lib';
import {CfnOutput, Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Upload} from "./upload";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {DynamoStreamPipe} from "./dynamo-stream-pipe";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import {Ec2BasicConfig} from "./ec2-basic-config";

export class AwsUploadCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.Table(this, 'UploadRecord', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            stream: dynamodb.StreamViewType.NEW_IMAGE,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        })
        new CfnOutput(this, 'DynamoDbTableName', {
            exportName: 'DynamoDbTableName',
            value: table.tableName
        });

        const queue = new sqs.Queue(this, 'EbSqsEcsQueue', {
            visibilityTimeout: Duration.seconds(300)
        });

        new Upload(this, 'upload', {table: table});
        new DynamoStreamPipe(this, 'sqsDynamoDataPipe', {table: table, queue: queue})
        new Ec2BasicConfig(this, 'ec2BasicConfig', {table: table});
    }
}
