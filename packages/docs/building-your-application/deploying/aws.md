---
title: Deploying on AWS
---

# Deploying on AWS

This documentation outlines the process of deploying a Brisa application on AWS. AWS is a cloud service provider that offers a wide range of services, including hosting, storage, and databases.

To deploy a Brisa application on AWS, you can use [Docker](/building-your-application/deploying/docker) to containerize your application and deploy it on [AWS Elastic Container Service](https://aws.amazon.com/es/ecs/) (ECS). ECS is a fully managed container orchestration service that allows you to run and scale containerized applications on AWS.

## Prerequisites

Before deploying your Brisa application on AWS, you need to have the following prerequisites:

- **AWS account**: You need to have an AWS account to use AWS services.
- **Docker**: You need to have Docker installed on your local machine to containerize your application.
- **AWS CLI**: You need to have the AWS Command Line Interface (CLI) installed on your local machine to interact with AWS services.

## Containerize your Brisa application

To deploy your Brisa application on AWS, you need to containerize your application using Docker. You can follow the [Containerize with Docker](/building-your-application/deploying/docker) guide to create a Dockerfile for your Brisa application.

## Deploy on AWS ECS

Once you have containerized your Brisa application, you can deploy it on AWS ECS. Here are the steps to deploy your application on AWS ECS:

1. **Create an ECS cluster**: You need to create an ECS cluster to run your containerized application. You can create an ECS cluster using the AWS Management Console or the AWS CLI.
2. **Create an ECS task definition**: You need to create an ECS task definition that defines how your containerized application should run. You can create an ECS task definition using the AWS Management Console or the AWS CLI.
3. **Create an ECS service**: You need to create an ECS service that runs your containerized application as tasks in the ECS cluster. You can create an ECS service using the AWS Management Console or the AWS CLI.
4. **Deploy your application**: Once you have created the ECS cluster, task definition, and service, you can deploy your containerized Brisa application on AWS ECS.

## Conclusion

Deploying a Brisa application on AWS ECS allows you to run and scale your application on AWS cloud infrastructure. By containerizing your application and deploying it on ECS, you can take advantage of AWS's managed container orchestration service to run your Brisa application in a scalable and reliable environment.

