# ECS Node Demo — Full AWS CLI Deployment Log

This document contains the complete sequence of AWS CLI commands used to deploy an application to **Amazon ECS (EC2 launch type)** using the AWS CLI.

## Deployment Stack

* Application Load Balancer (ALB)
* Target Group (IP target type)
* `awsvpc` network mode
* Auto Scaling Group (1 × t3.micro)
* Amazon Elastic Container Registry (ECR) image
* Region: **eu-north-1**

---

# 1. Clean Slate Verification

Before deploying, existing AWS resources were checked to ensure the environment was clean.

```bash
aws ecs list-clusters

aws ec2 describe-instances \
--query "Reservations[*].Instances[*].[InstanceId,State.Name]" \
--output table

aws elbv2 describe-load-balancers --output table

aws autoscaling describe-auto-scaling-groups \
--query "AutoScalingGroups[*].[AutoScalingGroupName,DesiredCapacity]" \
--output table
```

---

# 2. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name ecs-node-demo-cluster
```

---

# 3. Verify ECS Instance Profile

```bash
aws iam get-instance-profile --instance-profile-name ecsInstanceRole
```

This role allows EC2 instances to register with the ECS cluster.

---

# 4. Get Latest ECS Optimized AMI

```bash
aws ssm get-parameter \
--name /aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id \
--query "Parameter.Value" \
--output text
```

---

# 5. Networking Setup

## Get Default VPC

```bash
aws ec2 describe-vpcs \
--filters Name=isDefault,Values=true \
--query "Vpcs[0].VpcId" \
--output text
```

---

## Create ALB Security Group

```bash
aws ec2 create-security-group \
--group-name ecs-node-demo-alb-sg \
--description "ALB security group for ECS demo" \
--vpc-id <VPC_ID>
```

Allow inbound HTTP traffic:

```bash
aws ec2 authorize-security-group-ingress \
--group-id <ALB_SG> \
--protocol tcp \
--port 80 \
--cidr 0.0.0.0/0
```

---

## Create Task Security Group

```bash
aws ec2 create-security-group \
--group-name ecs-node-demo-task-sg \
--description "Security group for ECS tasks" \
--vpc-id <VPC_ID>
```

Allow traffic from ALB to container:

```bash
aws ec2 authorize-security-group-ingress \
--group-id <TASK_SG> \
--ip-permissions \
"IpProtocol=tcp,FromPort=8080,ToPort=8080,UserIdGroupPairs=[{GroupId=<ALB_SG>}]"
```

---

## List Public Subnets

```bash
aws ec2 describe-subnets \
--filters "Name=vpc-id,Values=<VPC_ID>" \
--query "Subnets[*].[SubnetId,AvailabilityZone,MapPublicIpOnLaunch]" \
--output table
```

---

# 6. Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
--name ecs-node-demo-alb \
--type application \
--scheme internet-facing \
--security-groups <ALB_SG> \
--subnets <SUBNET1> <SUBNET2>
```

Retrieve ALB DNS name:

```bash
aws elbv2 describe-load-balancers \
--load-balancer-arns <ALB_ARN> \
--query "LoadBalancers[0].DNSName" \
--output text
```

---

# 7. Create Target Group

```bash
aws elbv2 create-target-group \
--name ecs-node-demo-tg \
--protocol HTTP \
--port 8080 \
--target-type ip \
--vpc-id <VPC_ID> \
--health-check-path /health \
--matcher HttpCode=200-399
```

---

# 8. Create Listener

```bash
aws elbv2 create-listener \
--load-balancer-arn <ALB_ARN> \
--protocol HTTP \
--port 80 \
--default-actions Type=forward,TargetGroupArn=<TG_ARN>
```

---

# 9. Create Launch Template

Create ECS cluster configuration file:

```bash
cat > ecs-userdata.txt << 'EOF'
#!/bin/bash
echo ECS_CLUSTER=ecs-node-demo-cluster >> /etc/ecs/ecs.config
EOF
```

Encode user data:

```bash
USERDATA_B64=$(base64 -w 0 ecs-userdata.txt)
```

Create launch template:

```bash
aws ec2 create-launch-template \
--launch-template-name ecs-node-demo-lt \
--launch-template-data '{
"ImageId":"<AMI_ID>",
"InstanceType":"t3.micro",
"IamInstanceProfile":{"Name":"ecsInstanceRole"},
"SecurityGroupIds":["<TASK_SG>"],
"UserData":"<BASE64_USERDATA>"
}'
```

---

# 10. Create Auto Scaling Group

```bash
aws autoscaling create-auto-scaling-group \
--auto-scaling-group-name ecs-node-demo-asg \
--launch-template LaunchTemplateId=<LT_ID>,Version='$Latest' \
--min-size 1 \
--max-size 1 \
--desired-capacity 1 \
--vpc-zone-identifier "<SUBNET1>,<SUBNET2>"
```

---

# 11. Confirm Container Instance Registration

```bash
aws ecs list-container-instances \
--cluster ecs-node-demo-cluster
```

---

# 12. Authenticate with Amazon ECR

```bash
aws ecr get-login-password --region eu-north-1 | \
docker login --username AWS --password-stdin \
545586474482.dkr.ecr.eu-north-1.amazonaws.com
```

Push container image:

```bash
docker push 545586474482.dkr.ecr.eu-north-1.amazonaws.com/ecs-node-demo:latest
```

Verify images:

```bash
aws ecr list-images \
--repository-name ecs-node-demo \
--region eu-north-1 \
--output table
```

---

# 13. Register Task Definition

```bash
aws ecs register-task-definition \
--cli-input-json file://taskdef.json
```

---

# 14. Create ECS Service

```bash
aws ecs create-service \
--cluster ecs-node-demo-cluster \
--service-name ecs-node-demo-service \
--task-definition <TD_ARN> \
--desired-count 1 \
--launch-type EC2 \
--network-configuration \
"awsvpcConfiguration={subnets=[<SUBNET1>,<SUBNET2>],securityGroups=[<TASK_SG>],assignPublicIp=DISABLED}" \
--load-balancers \
"targetGroupArn=<TG_ARN>,containerName=ecs-node-demo,containerPort=8080"
```

---

# 15. Verify Target Health

```bash
aws elbv2 describe-target-health \
--target-group-arn <TG_ARN> \
--output table
```

---

# 16. Test Application

```bash
curl -i http://<ALB_DNS>/health
curl -i http://<ALB_DNS>/
curl -i http://<ALB_DNS>/info
```

---

# Deployment Result

* ECS Service running with **1 task**
* Target group status: **Healthy**
* Application Load Balancer returning **HTTP 200**
* Application responding successfully

---

# Final Architecture

```
Internet
   ↓
Application Load Balancer (HTTP 80)
   ↓
Target Group (IP)
   ↓
ECS Task (awsvpc network mode)
   ↓
Container running on port 8080
```

---

**End of Deployment Log**
