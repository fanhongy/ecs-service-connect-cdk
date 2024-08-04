import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class EcsServiceConnectDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: 'vpc-0d2733d2d38dad954'
    })

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: vpc,
      clusterName: 'ecs-service-connect-demo-cluster',
      defaultCloudMapNamespace: {
        name: 'ecs-service-connect-demo',
        useForServiceConnect: true
      },
    });


    // Fargate Task Definition for Nginx (Service A)
    const taskDefA = new ecs.FargateTaskDefinition(this, 'TaskDefA', {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });

    const nginxImage = new ecr_assets.DockerImageAsset(this, 'NginxImage', {
      directory: './nginx/', // Adjust the path
    });

    taskDefA.addContainer('nginx', {
      image: ecs.ContainerImage.fromDockerImageAsset(nginxImage),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'nginx' }),
      portMappings: [{
        name: 'nginx',
        containerPort: 80
      }],
    });

    // Fargate Task Definition for Service B (Python Backend)
    const taskDefB = new ecs.FargateTaskDefinition(this, 'TaskDefB', {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });

    const serviceBImage = new ecr_assets.DockerImageAsset(this, 'ServiceBImage', {
      directory: './service_b', // Adjust the path
    });

    taskDefB.addContainer('service_b', {
      image: ecs.ContainerImage.fromDockerImageAsset(serviceBImage),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'service_b' }),
      portMappings: [{
        name: 'service_b',
        containerPort: 80
      }],
    });

    // Fargate Task Definition for Service C (Python Backend)
    const taskDefC = new ecs.FargateTaskDefinition(this, 'TaskDefC', {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });

    const serviceCImage = new ecr_assets.DockerImageAsset(this, 'ServiceCImage', {
      directory: './service_c', // Adjust the path
    });

    taskDefC.addContainer('service_c', {
      image: ecs.ContainerImage.fromDockerImageAsset(serviceCImage),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'service_c' }),
      portMappings: [{ name: 'service_c', containerPort: 80 }],
    });
    // Create a security group for the ECS service
    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'MyServiceSG', {
      vpc,
      description: 'Security group for the ECS service',
      allowAllOutbound: true
    });

    // Add inbound rules to the security group
    serviceSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

    // Fargate Service A (Nginx)
    const nginxService = new ecs.FargateService(this, 'nginxService', {
      cluster,
      taskDefinition: taskDefA,
      securityGroups: [serviceSecurityGroup],
      serviceConnectConfiguration: {
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'service-connect' }),
        services: [
          {
            portMappingName: 'nginx',
            dnsName: 'nginx',
            port: 80,
          },
        ],
      },
    });

    // Fargate Service B
    const fargateServiceB = new ecs.FargateService(this, 'FargateServiceB', {
      cluster,
      taskDefinition: taskDefB,
      serviceConnectConfiguration: {
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'service-connect' }),
        services: [
          {
            portMappingName: 'service_b',
            dnsName: 'service_b',
            port: 80,
          },
        ],
      },
    });

    // Fargate Service C
    const fargateServiceC = new ecs.FargateService(this, 'FargateServiceC', {
      cluster,
      taskDefinition: taskDefC,
      serviceConnectConfiguration: {
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'service-connect' }),
        services: [
          {
            portMappingName: 'service_c',
            dnsName: 'service_c',
            port: 80,
          },
        ],
      },
    });

    // fargateServiceA.enableServiceConnect();
    // fargateServiceB.enableServiceConnect();
    // fargateServiceC.enableServiceConnect();
    fargateServiceB.connections.allowFrom(nginxService, ec2.Port.tcp(80),);
    fargateServiceC.connections.allowFrom(nginxService, ec2.Port.tcp(80),);
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    listener.addTargets('ServiceATarget', {
      port: 80,
      targets: [nginxService],
    });
  }
}
