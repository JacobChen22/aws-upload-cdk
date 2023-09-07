import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Upload} from "./upload";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {Ec2Scripting} from "./ec2-scripting";

export class AwsUploadCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.Table(this, 'UploadRecord', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            stream: dynamodb.StreamViewType.NEW_IMAGE,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        })


        new Upload(this, 'upload', {table: table});
        new Ec2Scripting(this, 'ec2Script', {table: table})
    }
}
