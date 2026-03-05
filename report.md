# ECS Application Deployment Project

**Author:** Chioma Vanessa Egwuibe &  Collins

**Course:** Cloudboosta Training  Peer Project

**Date:** 5th March 2026  

---

## Objective

The objective of this project is to containerize a web application using Docker, push the container image to Amazon Elastic Container Registry (ECR), deploy the container on Amazon Elastic Container Service (ECS) using the EC2 launch type, and expose the application to the internet using an Application Load Balancer (ALB).

The final result should be a working web application accessible through a public URL provided by the load balancer.

## Tools and AWS Services Used

The following tools and AWS services were used in this project:

- Docker
- AWS CLI
- Amazon Elastic Container Registry (ECR)
- Amazon Elastic Container Service (ECS)
- Amazon EC2
- Application Load Balancer (ALB)
- Security Groups
- IAM Roles
- Visual Studio Code

## Architecture Overview

The architecture of this project consists of a containerized web application deployed on ECS. User requests are routed through an Application Load Balancer which forwards traffic to the ECS service running on EC2 container instances.

The flow of traffic is as follows:

User → Application Load Balancer → ECS Service → EC2 Container Instance → Docker Container → Web Application

(Insert architectural diagram here)


## Step 1: Server Setup

The first step was preparing the environment required for the deployment.

The following tools were installed and configured:

- Docker for building and running containers
- AWS CLI for interacting with AWS services from the command line

AWS credentials were configured using the following command:

```bash
aws configure
```

This allowed the system to authenticate with AWS and access services such as ECR and ECS.


---


## Step 2: Containerizing the Application with Docker

A Dockerfile was created to define how the web application should be packaged into a container image.

The Dockerfile specifies:
- The base image
- The application dependencies
- The port the application listens on
- The command used to start the application

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY server.js .

EXPOSE 8080

CMD ["node", "server.js"]
```


### Step 3: Building the Docker Image

The Docker image was built locally using the following command:

```bash
docker build -t ecs-demo-app .
```

The container was tested locally to ensure the application works before pushing it to AWS.

```bash
docker run -p 8080:8080 ecs-demo-app
```

This allowed the application to be accessed locally via:
http://localhost:8080


## Step 4: Pushing the Docker Image to Amazon ECR

After verifying that the application container works locally, the next step was to store the Docker image in **Amazon Elastic Container Registry (ECR)**. ECR is AWS’s managed container registry service used for storing and retrieving Docker images.

### Creating the ECR Repository

A new repository was created in the AWS Console under **Amazon ECR**. This repository stores the Docker image that will later be used by ECS to run the container.

### Authenticating Docker with ECR

Docker was authenticated with Amazon ECR using the AWS CLI:

```bash
aws ecr get-login-password --region eu-north-1 \
| docker login \
--username AWS \
--password-stdin 545586474482.dkr.ecr.eu-north-1.amazonaws.com
```

### Tagging the Docker Image

The locally built image was tagged with the ECR repository URI.

```bash
docker tag ecs-demo-app:latest \
545586474482.dkr.ecr.eu-north-1.amazonaws.com/ecs-node-demo:latest
```

### Pushing the Image to ECR

The Docker image was then pushed to the ECR repository.

```bash
docker push \
545586474482.dkr.ecr.eu-north-1.amazonaws.com/ecs-node-demo:latest
```

Once the push completed successfully, the image became available in the ECR repository and could be used by Amazon ECS to deploy containers.