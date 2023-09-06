import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Upload} from "./upload";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsUploadCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Upload(this, 'upload');
  }
}
