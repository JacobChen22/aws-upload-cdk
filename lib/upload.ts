import {Construct} from 'constructs';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Cors, LambdaRestApi} from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface UploadProps {
    table: dynamodb.Table;
}

export class Upload extends Construct {

    constructor(scope: Construct, id: string, props: UploadProps) {
        super(scope, id);

        const uploadFunction = new NodejsFunction(this, 'function', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'lambdas/upload.function.ts',
            handler: 'handler',
            environment: {
                UPLOAD_TABLE_NAME: props.table.tableName
            }
        });

        props.table.grantReadWriteData(uploadFunction);

        const lambdaUploadApi = new LambdaRestApi(this, 'apigw', {
            handler: uploadFunction,
            proxy: true,
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            }
        });

        // Below codes for enable Cognito on API-Gateway
        /*
        const userPool = new UserPool(this, 'userPool', {
            signInAliases: {
                email: true
            }
        });
        const authorizer = new CognitoUserPoolsAuthorizer(this, 'lambdaAuthorizer', {
            cognitoUserPools: [userPool]
        });
        const upload = lambdaUploadApi.root.addResource('UPLOAD');
        upload.addMethod('PUT', new LambdaIntegration(uploadFunction), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: authorizer
        });
        */

    }
}