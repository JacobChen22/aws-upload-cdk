import {Construct} from "constructs";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {IpAddresses} from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import {Asset} from "aws-cdk-lib/aws-s3-assets";
import * as path from "path";

export interface Ec2Props {
    table: dynamodb.Table;
}

export class Ec2Scripting extends Construct {
    constructor(scope: Construct, id: string, props: Ec2Props) {
        super(scope, id);

        const scriptBucketName = 'ec2-file-processing'

        const key = new ec2.CfnKeyPair(this, 'Ec2Stack', {
            keyName: `${id}-keypair`
        })

        const vpc = new ec2.Vpc(this, `${id}VPC`, {
            createInternetGateway: false,
            ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
            subnetConfiguration: [
                {
                    name: 'ec2subnet',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }
            ]
        });
        const allowAccessPolicy = new iam.PolicyStatement({
            actions: ['*'],
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            resources: ['*'],
        });

        // S3 endpoint
        const s3VpcEndpoint = new ec2.GatewayVpcEndpoint(this, 'S3VpcEndpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            vpc,
        });
        s3VpcEndpoint.addToPolicy(allowAccessPolicy);

        // DynamoDb endpoint
        const dynamoDBVpcEndpoint = new ec2.GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            vpc,
        });
        dynamoDBVpcEndpoint.addToPolicy(allowAccessPolicy);

        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc: vpc,
            description: 'Allow ssh access to ec2 instances',
            allowAllOutbound: true   // Can be set to false
        });
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow ssh access from the world');

        const ami = new ec2.GenericLinuxImage({
            'us-east-2': 'ami-0cf0e376c672104d6'
        });

        // iam.Role
        const ec2role = new iam.Role(this, 'ec2-instance-role', {
            roleName: 'ec2-instance-role',
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
            ]
        });
        ec2role.addToPolicy(
            new iam.PolicyStatement({
                actions: ['ec2:StartInstances'],
                resources: ['*'],
            })
        );

        const ec2Instance = new ec2.Instance(this, `${id}Instance`, {
            vpc: vpc,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T2,
                ec2.InstanceSize.MICRO
            ),
            role: ec2role,
            machineImage: ami,
            securityGroup: securityGroup,
            keyName: key.keyName,
            instanceName: `${id}Ec2Instance`
        });

        const s3scriptAsset = new Asset(this, 's3scriptAsset', {
            path: path.join(__dirname, '../lib/processing.sh')
        });
        const localPath = ec2Instance.userData.addS3DownloadCommand({
            bucket: s3scriptAsset.bucket,
            bucketKey: s3scriptAsset.s3ObjectKey
        });
        ec2Instance.userData.addExecuteFileCommand({
            filePath: localPath,
            arguments: '--verbose -y'
        });
        s3scriptAsset.grantRead(ec2Instance.role);

    }

}