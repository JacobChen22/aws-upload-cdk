# AWS CDK deploye demo

This is a demo project for aws cdk deploy.

## Deploy project

1. Install dependencies on your local machine:

* `npm install`   download dependencies

2. Configure your aws account on your local machine:

### `aws configure`

* AWS Access Key ID: Your AWS dev account, please retrieve it from AWS IAM console.
* AWS Secret Access Key: Your AWS account access key, please retrieve it from AWS IAM console.
* Default region name: Set default deploy region.

3. Deploy

### `aws deploy`

* wait for the command finish, then it will give you an API-Gateway link for data-mock input,
* example: AwsUploadCdkStack.uploadapigwEndpointXXXXX = https://xxxxxx.us-east-2.amazonaws.com/prod/

4. Test function

* If you have postman or any other test tool, you can simulate a request for input data into DynamoDB:

```http request
PUT https://xxxxxx.us-east-2.amazonaws.com/prod/ HTTP/1.1
Accept: application/json
{
    "userInput": "after.pdf",
    "path": "before.txt"
}
```

* This will insert data into DynamoDB, then trigger lambda function to start an EC2 instance to process it.
* You can check your DynamoDB table data ,and EC2 instance from AWS console.

## Full function with frontend

1. Please pull frontend repo, and follow its instructions to deploy it.
2. After you complete both this CDK demo and frontend, you can upload a file from browser.

## Whole infrastructure picture about this CDK app:

![cloud-infra](/assets/cloud-infra.jpg)