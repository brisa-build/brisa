---
title: Deploying on AWS
---

# Deploying on AWS

This documentation outlines the process of deploying a Brisa application on AWS. AWS is a cloud service provider that offers a wide range of services, including hosting, storage, and databases.

Depending on your [`output`](/building-your-application/configuring/output) strategy, you can deploy your Brisa application on AWS using different approaches:

- **Static exports** ([`output="static"`](/building-your-application/configuring/output#2-static-output-static)): You can deploy your Brisa application as a static website on [Amazon S3](https://aws.amazon.com/s3/) or [Amazon CloudFront](https://aws.amazon.com/cloudfront/).
- **Docker containers** ([`output="server"`](/building-your-application/configuring/output#1-server-output-server)): You can containerize your Brisa application using [Docker](/building-your-application/deploying/docker) and deploy it on [Amazon Elastic Container Service](https://aws.amazon.com/ecs/) (ECS). This approach is recommended for applications that require server-side logic or API endpoints.

## Deploying as a static website

To deploy a Brisa application as a static website on AWS, you can use [Amazon S3](https://aws.amazon.com/s3/) to host your static assets and [Amazon CloudFront](https://aws.amazon.com/cloudfront/) to serve your content globally with low latency.

For static site, you need to modify the [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js) file as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "static",
} satisfies Configuration;
```

Here are the steps to deploy your Brisa application as a static website on AWS:

1. **Create an S3 bucket**: Create an S3 bucket to store your static assets. You can create an S3 bucket using the AWS Management Console or the AWS CLI.
2. **Upload your static assets**: Upload the contents of the `out` folder to your S3 bucket. You can use the AWS Management Console, the AWS CLI, or an S3 client to upload your static assets.

Once you have uploaded your static assets to your S3 bucket, you can configure Amazon CloudFront to serve your content globally with low latency. You can create a [CloudFront](https://aws.amazon.com/cloudfront/) distribution that points to your S3 bucket and configure it to cache your content at edge locations around the world.

## Deploying with Docker containers

To deploy a Brisa application on AWS, you can use [Docker](/building-your-application/deploying/docker) to containerize your application and deploy it on [AWS Elastic Container Service](https://aws.amazon.com/es/ecs/) (ECS). ECS is a fully managed container orchestration service that allows you to run and scale containerized applications on AWS.

### Prerequisites

Before deploying your Brisa application on AWS, you need to have the following prerequisites:

- **AWS account**: You need to have an AWS account to use AWS services.
- **Docker**: You need to have Docker installed on your local machine to containerize your application.
- **AWS CLI**: You need to have the AWS Command Line Interface (CLI) installed on your local machine to interact with AWS services.

### Containerize your Brisa application

To deploy your Brisa application on AWS, you need to containerize your application using Docker. You can follow the [Containerize with Docker](/building-your-application/deploying/docker) guide to create a Dockerfile for your Brisa application.

### Deploy on AWS ECS

Once you have containerized your Brisa application, you can deploy it on AWS ECS. Here are the steps to deploy your application on AWS ECS:

1. **Create an ECS cluster**: You need to create an ECS cluster to run your containerized application. You can create an ECS cluster using the AWS Management Console or the AWS CLI.
2. **Create an ECS task definition**: You need to create an ECS task definition that defines how your containerized application should run. You can create an ECS task definition using the AWS Management Console or the AWS CLI.
3. **Create an ECS service**: You need to create an ECS service that runs your containerized application as tasks in the ECS cluster. You can create an ECS service using the AWS Management Console or the AWS CLI.
4. **Deploy your application**: Once you have created the ECS cluster, task definition, and service, you can deploy your containerized Brisa application on AWS ECS.

By following these steps, you can deploy your Brisa application on AWS using Docker containers and AWS ECS. This approach is recommended for applications that require server-side logic or API endpoints.

### Uploading assets (images, files, etc.) to S3

When deploying your Brisa application on AWS, you may need to upload assets such as images, files, or other resources to your S3 bucket. You can use the AWS Management Console, the AWS CLI, or an S3 client to upload assets to your S3 bucket.

To upload assets to your S3 bucket, you can follow these steps:

1. **Create an S3 bucket**: Create an S3 bucket to store your assets. You can create an S3 bucket using the AWS Management Console or the AWS CLI.
2. **Upload assets**: Upload your assets to the S3 bucket using the AWS Management Console, the AWS CLI, or an S3 client.
3. **Configure assets from CDN**: You need to modify the [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js) to add an [`assetPrefix`](/building-your-application/configuring/asset-prefix), pointing to the CDN URL of your S3 bucket. This ensures that your Brisa application loads assets from the CDN.

