# AWS API Gateway 設置指南

> ⚠️ **警告**: 這會增加系統複雜度和運營成本。建議先評估是否真的需要。

## 前置需求

- AWS 帳號
- AWS CLI 已安裝並配置
- Node.js 20+
- Terraform 或 AWS SAM (可選,用於 IaC)

## 方案一: 使用 AWS SAM (Serverless Application Model)

### 1. 安裝 AWS SAM CLI

```bash
# macOS
brew install aws-sam-cli

# 驗證安裝
sam --version
```

### 2. 初始化專案

```bash
# 在專案根目錄
mkdir aws-api
cd aws-api

# 初始化 SAM 專案
sam init \
  --runtime nodejs20.x \
  --name jianlin-api \
  --app-template hello-world
```

### 3. 定義 SAM 模板 (template.yaml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Jianlin API Gateway

Globals:
  Function:
    Timeout: 10
    MemorySize: 512
    Runtime: nodejs20.x
    Environment:
      Variables:
        DYNAMODB_TABLE: !Ref CasesTable

Resources:
  # API Gateway
  JianlinApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        ApiKeyRequired: true
        UsagePlan:
          CreateUsagePlan: PER_API
          Quota:
            Limit: 10000
            Period: MONTH
          Throttle:
            BurstLimit: 100
            RateLimit: 50

  # Lambda: Get Cases
  GetCasesFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/get-cases/
      Handler: index.handler
      Events:
        GetCases:
          Type: Api
          Properties:
            RestApiId: !Ref JianlinApi
            Path: /cases
            Method: GET
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref CasesTable

  # Lambda: Create Case
  CreateCaseFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/create-case/
      Handler: index.handler
      Events:
        CreateCase:
          Type: Api
          Properties:
            RestApiId: !Ref JianlinApi
            Path: /cases
            Method: POST
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref CasesTable

  # DynamoDB Table
  CasesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: jianlin-cases
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: numberID
          AttributeType: S
      KeySchema:
        - AttributeName: numberID
          KeyType: HASH

Outputs:
  ApiUrl:
    Description: "API Gateway endpoint URL"
    Value: !Sub "https://${JianlinApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
  ApiKey:
    Description: "API Key ID"
    Value: !Ref JianlinApi.ApiKey
```

### 4. Lambda Function 範例

**functions/get-cases/index.js**
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE
    });

    const response = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items: response.Items || []
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
```

**functions/get-cases/package.json**
```json
{
  "name": "get-cases",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.600.0",
    "@aws-sdk/lib-dynamodb": "^3.600.0"
  }
}
```

### 5. 部署

```bash
# 建置
sam build

# 部署 (首次)
sam deploy --guided

# 後續部署
sam deploy
```

### 6. 測試

```bash
# 取得 API URL 和 Key
aws apigateway get-api-keys --include-values

# 測試 API
curl -H "x-api-key: YOUR_API_KEY" \
  https://xxx.execute-api.us-east-1.amazonaws.com/prod/cases
```

## 方案二: 使用 Terraform

### 1. 建立 Terraform 配置

**main.tf**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"  # 東京
}

# API Gateway
resource "aws_api_gateway_rest_api" "jianlin_api" {
  name        = "jianlin-api"
  description = "Jianlin API Gateway"
}

# DynamoDB
resource "aws_dynamodb_table" "cases" {
  name           = "jianlin-cases"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "numberID"

  attribute {
    name = "numberID"
    type = "S"
  }

  tags = {
    Environment = "production"
    Project     = "jianlin"
  }
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_role" {
  name = "jianlin-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# ... (更多資源定義)
```

### 2. 部署

```bash
terraform init
terraform plan
terraform apply
```

## 方案三: 純手動設置 (不推薦)

### 1. 建立 DynamoDB 表

```bash
aws dynamodb create-table \
  --table-name jianlin-cases \
  --attribute-definitions AttributeName=numberID,AttributeType=S \
  --key-schema AttributeName=numberID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

### 2. 建立 Lambda Function

在 AWS Console:
1. Lambda → Create function
2. Runtime: Node.js 20.x
3. 上傳程式碼 ZIP
4. 設定環境變數
5. 設定 IAM 權限

### 3. 建立 API Gateway

在 AWS Console:
1. API Gateway → Create API → REST API
2. Create Resource → /cases
3. Create Method → GET, POST, PUT, DELETE
4. Integration type → Lambda Function
5. Deploy API → prod stage

## 遷移現有資料

### 從 JSON 遷移到 DynamoDB

**migration-script.js**
```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

const client = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function migrate() {
  // 讀取 JSON
  const cases = JSON.parse(fs.readFileSync('./lib/data/case.json', 'utf-8'));

  // 寫入 DynamoDB
  for (const item of cases) {
    await docClient.send(new PutCommand({
      TableName: 'jianlin-cases',
      Item: item
    }));
    console.log(`Migrated: ${item.numberID}`);
  }

  console.log('Migration completed!');
}

migrate().catch(console.error);
```

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
node migration-script.js
```

## 自訂域名設定

### 1. 申請 SSL 憑證 (ACM)

```bash
aws acm request-certificate \
  --domain-name api.jianlin.com \
  --validation-method DNS \
  --region us-east-1  # 必須在 us-east-1
```

### 2. 設定 API Gateway 自訂域名

```bash
aws apigateway create-domain-name \
  --domain-name api.jianlin.com \
  --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx
```

### 3. 更新 DNS (Route 53 或你的 DNS 提供商)

```
api.jianlin.com → CNAME → xxx.cloudfront.net
```

## 監控與日誌

### CloudWatch 設定

```bash
# 啟用 API Gateway 日誌
aws apigateway update-stage \
  --rest-api-id xxx \
  --stage-name prod \
  --patch-operations \
    op=replace,path=/accessLogSettings/destinationArn,value=arn:aws:logs:xxx
```

### 成本監控

在 AWS Console → Cost Explorer:
1. 設定預算警報
2. 監控 API Gateway, Lambda, DynamoDB 費用
3. 設定每月 $10 USD 警報

## 費用優化

1. **啟用 API 快取** (如果讀多寫少)
2. **Lambda 預留容量** (如果流量穩定)
3. **DynamoDB Auto Scaling** (按需調整)
4. **CloudFront** 搭配 API Gateway (減少請求數)

## 安全最佳實踐

1. 使用 API Key 或 Cognito 認證
2. 啟用 WAF (Web Application Firewall)
3. 限流設定
4. VPC 內網連接 (如果需要)
5. 定期輪換 API Keys

## 回滾計畫

保留原本的 Next.js API 作為備份:

```typescript
// lib/api-client.ts
const API_BASE = process.env.USE_AWS_API
  ? 'https://api.jianlin.com'
  : '/api/admin';

export async function getCases() {
  const response = await fetch(`${API_BASE}/cases`);
  return response.json();
}
```

## 總結

**複雜度評分: 8/10**
**維護成本: 中等**
**建議: 除非有明確的多專案需求,否則保持 Next.js API 即可**
