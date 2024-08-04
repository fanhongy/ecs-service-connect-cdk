#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsServiceConnectDemoStack } from '../lib/app';

const app = new cdk.App();
new EcsServiceConnectDemoStack(app, 'EcsServiceConnectStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});