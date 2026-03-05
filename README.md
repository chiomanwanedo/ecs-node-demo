Deploying a Containerized Web Application on Amazon ECS (EC2) with Application Load Balancer
Project Overview

This project demonstrates how to deploy a containerized web application on Amazon Elastic Container Service (ECS) using the EC2 launch type. The application is packaged as a Docker image, stored in Amazon Elastic Container Registry (ECR), and deployed through an ECS service behind an Application Load Balancer (ALB).

The goal of this project is to demonstrate practical experience with containerization, AWS container orchestration, and scalable application deployment.

Architecture

The application deployment follows this architecture:

User → Application Load Balancer → ECS Service → ECS Task → Docker Container

AWS services used:
Amazon ECS (EC2 launch type)
Amazon EC2
Amazon ECR
Application Load Balancer (ALB)
Target Groups
IAM
CloudWatch
Docker



Tools used in this project:
Docker
Visual Studio Code
Git & GitHub

Project Structure
ecs-node-demo/
│
├── Dockerfile
├── index.html
├── package.json
├── package-lock.json
├── taskdef.json
│
├── README.md
├── report.md
│
├── screenshots/
│   ├── alb-configuration.png
│   ├── application-running-on-alb.png
│   ├── docker-image.png
│   ├── ecr-repository.png
│   ├── ecs-cluster.png
│   ├── ecs-service-running.png
│   ├── ecs-task-definition.png
│   ├── local-container-test.png
│   └── target-group-health.png

Step 1 — Containerizing the Application

A Docker image was created for the web application using a Dockerfile.

Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html

The Docker image was built locally using:
docker build -t ecs-demo-app .


Step 2 — Testing the Container Locally
Before deploying to AWS, the container was tested locally.
docker run -p 8080:80 ecs-demo-app
Local Container Test

Step 3 — Pushing the Image to Amazon ECR
An Amazon ECR repository was created to store the Docker image.

aws ecr create-repository --repository-name ecs-node-demo

The image was then tagged and pushed to ECR.


Step 4 — Creating an ECS Cluster
An ECS cluster was created using the EC2 launch type to host container instances.


Step 5 — Creating the ECS Task Definition
The ECS task definition specifies the container image, CPU, memory, and networking configuration used to run the container.


Step 6 — Configuring the Application Load Balancer
An Application Load Balancer was configured to route external traffic to the ECS service.


Step 7 — Target Group Health Check
The target group health check verifies that the ECS tasks are healthy and able to serve requests.



Step 8 — Running ECS Service
An ECS service was created to maintain the desired number of running tasks and integrate with the load balancer.



Step 9 — Accessing the Application via Load Balancer
Once the service was running and the target group was healthy, the application became accessible through the ALB DNS endpoint.



Cleanup
To avoid unnecessary AWS charges, the following resources should be removed after testing:
ECS Service
ECS Cluster
EC2 instances
Target Groups
Application Load Balancer
ECR images


Conclusion
This project demonstrates the full lifecycle of deploying a containerized application on AWS using Amazon ECS and Docker. It highlights practical skills in containerization, cloud infrastructure configuration, and application deployment using managed AWS services.