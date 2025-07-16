#!/usr/bin/env tsx

import axios from 'axios';
import { execSync } from 'child_process';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  url?: string;
}

interface HealthCheckService {
  name: string;
  url?: string;
  check: () => Promise<void> | void;
}

class HealthChecker {
  private services: HealthCheckService[];

  constructor() {
    this.services = [
      {
        name: 'PostgreSQL',
        check: () => this.checkPostgreSQL()
      },
      {
        name: 'Redis',
        check: () => this.checkRedis()
      },
      {
        name: 'LocalStack',
        url: 'http://localhost:4566',
        check: () => this.checkLocalStack()
      },
      {
        name: 'Next.js',
        url: 'http://localhost:3000',
        check: () => this.checkHTTPService('http://localhost:3000')
      },
      {
        name: 'Lambda/SAM',
        url: 'http://localhost:3001',
        check: () => this.checkHTTPService('http://localhost:3001')
      },
      {
        name: 'Prisma Studio',
        url: 'http://localhost:5555',
        check: () => this.checkHTTPService('http://localhost:5555')
      },
      {
        name: 'PgAdmin',
        url: 'http://localhost:8080',
        check: () => this.checkHTTPService('http://localhost:8080')
      }
    ];
  }

  private checkPostgreSQL(): void {
    execSync('docker exec signature-postgres pg_isready -U dev_user -d signature_dev', { 
      stdio: 'pipe' 
    });
  }

  private checkRedis(): void {
    const result = execSync('docker exec signature-redis redis-cli ping', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    if (result.trim() !== 'PONG') {
      throw new Error('Redis ping failed');
    }
  }

  private async checkLocalStack(): Promise<void> {
    const response = await axios.get('http://localhost:4566/_localstack/health', {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`LocalStack returned status ${response.status}`);
    }

    // サービス状態の詳細確認
    const services = response.data.services || {};
    const unhealthyServices = Object.entries(services)
      .filter(([, status]) => status !== 'available')
      .map(([service]) => service);

    if (unhealthyServices.length > 0) {
      throw new Error(`Unhealthy LocalStack services: ${unhealthyServices.join(', ')}`);
    }
  }

  private async checkHTTPService(url: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept any status < 500
      });
      
      // 2xx, 3xx, 4xx are acceptable (service is running)
      if (response.status >= 500) {
        throw new Error(`Service returned error status ${response.status}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Service not running (connection refused)');
        }
        if (error.code === 'TIMEOUT') {
          throw new Error('Service timeout');
        }
      }
      throw error;
    }
  }

  private async checkService(service: HealthCheckService): Promise<ServiceStatus> {
    try {
      await service.check();
      return {
        name: service.name,
        status: 'healthy',
        url: service.url
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'unhealthy',
        message: (error as Error).message,
        url: service.url
      };
    }
  }

  private printServiceStatus(status: ServiceStatus): void {
    const icon = status.status === 'healthy' ? '✅' : '❌';
    const urlInfo = status.url ? ` (${status.url})` : '';
    
    console.log(`${icon} ${status.name}${urlInfo}`);
    
    if (status.message) {
      console.log(`   └─ ${status.message}`);
    }
  }

  private printSummary(results: ServiceStatus[]): void {
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    console.log(`\n📊 Health Summary: ${healthyCount}/${totalCount} services healthy`);
    
    if (healthyCount === totalCount) {
      console.log('🎉 All systems operational!');
    } else {
      console.log('⚠️  Some services need attention');
      
      const unhealthyServices = results
        .filter(r => r.status === 'unhealthy')
        .map(r => r.name);
      
      console.log('💡 To start missing services:');
      if (unhealthyServices.includes('PostgreSQL') || unhealthyServices.includes('Redis')) {
        console.log('   - Database services: npm run docker:db');
      }
      if (unhealthyServices.includes('LocalStack')) {
        console.log('   - LocalStack: npm run docker:services');
      }
      if (unhealthyServices.includes('Next.js')) {
        console.log('   - Next.js: npm run dev:web');
      }
      if (unhealthyServices.includes('Lambda/SAM')) {
        console.log('   - Lambda: npm run dev:lambda');
      }
      if (unhealthyServices.includes('Prisma Studio')) {
        console.log('   - Prisma Studio: npm run dev:studio');
      }
    }
  }

  async runHealthCheck(): Promise<boolean> {
    console.log('🔍 Checking system health...\n');
    
    const results = await Promise.all(
      this.services.map(service => this.checkService(service))
    );
    
    // 結果表示
    results.forEach(status => this.printServiceStatus(status));
    
    // サマリー表示
    this.printSummary(results);
    
    // すべてのサービスが健全かどうかを返す
    return results.every(r => r.status === 'healthy');
  }
}

async function main(): Promise<void> {
  try {
    const healthChecker = new HealthChecker();
    const allHealthy = await healthChecker.runHealthCheck();
    
    process.exit(allHealthy ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}