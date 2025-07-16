#!/usr/bin/env tsx

import { execSync } from 'child_process';
import axios from 'axios';

interface LocalStackConfig {
  url: string;
  maxAttempts: number;
  waitInterval: number;
}

interface AWSResource {
  name: string;
  command: string;
  description: string;
}

class LocalStackSetup {
  private config: LocalStackConfig;

  constructor(config: Partial<LocalStackConfig> = {}) {
    this.config = {
      url: 'http://localhost:4566',
      maxAttempts: 20,
      waitInterval: 2000,
      ...config
    };
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private awsCommand(cmd: string): string {
    return `aws --endpoint-url=${this.config.url} ${cmd}`;
  }

  private executeAWSCommand(command: string, description: string): void {
    try {
      console.log(`📦 ${description}...`);
      execSync(this.awsCommand(command), { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to ${description.toLowerCase()}: ${(error as Error).message}`);
    }
  }

  async waitForLocalStack(): Promise<void> {
    console.log('☁️ Waiting for LocalStack to be ready...');

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.config.url}/_localstack/health`);
        
        if (response.status === 200) {
          console.log('✅ LocalStack is ready!');
          console.log('📊 Available services:', Object.keys(response.data.services).join(', '));
          return;
        }
      } catch {
        if (attempt === this.config.maxAttempts) {
          throw new Error('LocalStack failed to start within expected time');
        }
        
        console.log(`⏳ Waiting for LocalStack... (${attempt}/${this.config.maxAttempts})`);
        await this.wait(this.config.waitInterval);
      }
    }
  }

  setupEnvironment(): void {
    console.log('🔧 Setting up AWS environment variables...');
    
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_DEFAULT_REGION = 'ap-northeast-1';
    
    console.log('✅ Environment variables configured');
  }

  async setupAWSResources(): Promise<void> {
    console.log('🛠️  Setting up AWS resources...');

    const resources: AWSResource[] = [
      {
        name: 'S3 Dev Bucket',
        command: 's3 mb s3://signature-dev-bucket',
        description: 'Creating development S3 bucket'
      },
      {
        name: 'S3 Test Bucket',
        command: 's3 mb s3://signature-test-bucket',
        description: 'Creating test S3 bucket'
      },
      {
        name: 'KMS Key',
        command: 'kms create-key --description "Local development signing key"',
        description: 'Creating KMS encryption key'
      },
      {
        name: 'SNS Topic',
        command: 'sns create-topic --name signature-notifications',
        description: 'Creating SNS notification topic'
      }
    ];

    for (const resource of resources) {
      try {
        this.executeAWSCommand(resource.command, resource.description);
        console.log(`✅ ${resource.name} created successfully`);
      } catch (error) {
        console.warn(`⚠️  ${resource.name} creation failed:`, (error as Error).message);
        // Continue with other resources
      }
    }
  }

  async verifySetup(): Promise<void> {
    console.log('🔍 Verifying LocalStack setup...');

    try {
      // S3バケット一覧確認
      console.log('📦 Available S3 buckets:');
      execSync(this.awsCommand('s3 ls'), { stdio: 'inherit' });

      // KMSキー確認
      console.log('🔑 Available KMS keys:');
      execSync(this.awsCommand('kms list-keys'), { stdio: 'inherit' });

      console.log('✅ LocalStack verification completed!');
    } catch (error) {
      console.warn('⚠️  Verification failed:', (error as Error).message);
    }
  }

  async run(): Promise<void> {
    try {
      this.setupEnvironment();
      await this.waitForLocalStack();
      await this.setupAWSResources();
      await this.verifySetup();
      
      console.log('🎉 LocalStack setup completed successfully!');
    } catch (error) {
      console.error('❌ LocalStack setup failed:', (error as Error).message);
      throw error;
    }
  }
}

async function main(): Promise<void> {
  try {
    const localStackSetup = new LocalStackSetup();
    await localStackSetup.run();
  } catch (error) {
    console.error('❌ Setup process failed:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}