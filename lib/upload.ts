import {Construct} from 'constructs';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {LambdaRestApi} from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

export class Upload extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const table = new dynamodb.Table(this, 'UploadRecord', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            removalPolicy: cdk.RemovalPolicy.DESTROY
        })

        const uploadFunction = new NodejsFunction(this, 'function', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'lambdas/upload.function.ts',
            handler: 'handler',
            environment: {
                UPLOAD_TABLE_NAME: table.tableName
            }
        });

        table.grantReadWriteData(uploadFunction);

        new LambdaRestApi(this, 'apigw', {
            handler: uploadFunction,
        });
    }
}