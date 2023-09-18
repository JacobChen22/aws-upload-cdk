import {Construct} from "constructs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {GatewayVpcEndpointAwsService, SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import {AnyPrincipal, Effect, Role} from "aws-cdk-lib/aws-iam";
import {CfnOutput, RemovalPolicy} from "aws-cdk-lib";

export interface Ec2Props {
    table: dynamodb.Table;
}

export class Ec2BasicConfig extends Construct {
    constructor(scope: Construct, id: string, props: Ec2Props) {
        super(scope, id);

        this.generatingKeyPair(id);

        const vpc = this.getVpc(id);
        this.addGatewayEndpoints(vpc, props);

        this.outputVpcSubnetsInfo(vpc);
        this.outputEc2SG(vpc);

        const ec2role = this.getEc2Role();
        this.outputEc2IamProfile(ec2role);

        const ec2PrivateBucket = new s3.Bucket(this, 'ec2PrivateBucket', {
            bucketName: 'ec2-conversed-object-bucket',
            removalPolicy: RemovalPolicy.DESTROY
        });

        ec2PrivateBucket.grantReadWrite(ec2role);
        props.table.grantReadWriteData(ec2role);
    }

    private outputVpcSubnetsInfo(vpc: Vpc) {
        new CfnOutput(this, 'subnetsProps', {
            exportName: 'SubnetIds',
            value: vpc.selectSubnets({subnetType: SubnetType.PRIVATE_ISOLATED}).subnetIds.toString()
        });
    }

    private outputEc2SG(vpc: Vpc) {
        const securityGroup = new ec2.SecurityGroup(this, 'securityGroup', {
            vpc: vpc,
            allowAllOutbound: true,
        });
        // export the security group
        new CfnOutput(this, 'ec2SecurityGroup', {
            exportName: 'Ec2SecurityGroupId',
            value: securityGroup.securityGroupId
        });
    }

    private outputEc2IamProfile(ec2role: Role) {
        const instanceProfile = new iam.InstanceProfile(this, 'instanceIamProfile', {
            role: ec2role
        });
        // export the ec2 role
        new CfnOutput(this, 'ec2IamProfile', {
            exportName: 'Ec2IamProfile',
            value: instanceProfile.instanceProfileArn
        });
    }

    private getEc2Role() {
        return new iam.Role(this, 'ec2Role', {
            roleName: 'ec2-instance-role',
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
            ]
        });
    }

    private addGatewayEndpoints(vpc: Vpc, props: Ec2Props) {
        const dynamoGatewayEndpoint = vpc.addGatewayEndpoint('dynamoGatewayEndpoint', {
            service: GatewayVpcEndpointAwsService.DYNAMODB,
        });
        dynamoGatewayEndpoint.addToPolicy(
            new iam.PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new AnyPrincipal()],
                actions: [
                    'dynamodb:*',
                ],
                resources: [
                    `${props.table.tableArn}`
                ]
            })
        );
        vpc.addGatewayEndpoint('s3GatewayEndpoint', {
            service: GatewayVpcEndpointAwsService.S3,
        });
    }

    private getVpc(id: string) {
        return new ec2.Vpc(this, `${id}VPC`, {
            natGateways: 0,
            createInternetGateway: false,
            subnetConfiguration: [
                {
                    name: 'application',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }
            ]
        });
    }

    private generatingKeyPair(id: string) {
        const key = new ec2.CfnKeyPair(this, 'ec2InstanceKey', {
            keyName: `${id}-keypair`
        })
        // export the key information
        new CfnOutput(this, 'ec2KeyProps', {
            exportName: 'Ec2InstanceKey',
            value: key.keyName
        });
    }
}