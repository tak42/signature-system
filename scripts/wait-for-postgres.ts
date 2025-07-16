#!/usr/bin/env tsx

import { execSync } from 'child_process';

const MAX_ATTEMPTS = 30;
const WAIT_INTERVAL = 2000; // 2秒

interface WaitConfig {
  maxAttempts: number;
  waitInterval: number;
}

class PostgresWaiter {
  private config: WaitConfig;

  constructor(config: WaitConfig = { maxAttempts: MAX_ATTEMPTS, waitInterval: WAIT_INTERVAL }) {
    this.config = config;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private executeCommand(command: string): boolean {
    try {
      execSync(command, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private checkPostgresAdmin(): boolean {
    return this.executeCommand('docker exec signature-postgres pg_isready -U postgres');
  }

  private checkDevUser(): boolean {
    return this.executeCommand('docker exec signature-postgres psql -U dev_user -d signature_dev -c "SELECT 1;"');
  }

  async waitForPostgres(): Promise<void> {
    console.log('🔄 Waiting for PostgreSQL to be ready...');

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const adminReady = this.checkPostgresAdmin();
      const devUserReady = this.checkDevUser();

      if (adminReady && devUserReady) {
        console.log('✅ PostgreSQL is ready!');
        console.log('✅ Dev user connection confirmed!');
        return;
      }

      if (attempt === this.config.maxAttempts) {
        const status = {
          admin: adminReady ? 'OK' : 'FAILED',
          devUser: devUserReady ? 'OK' : 'FAILED'
        };
        throw new Error(`PostgreSQL failed to start within expected time. Status: ${JSON.stringify(status)}`);
      }

      const statusMsg = adminReady ? 'Admin OK, waiting for dev user...' : 'Waiting for PostgreSQL...';
      console.log(`⏳ ${statusMsg} (${attempt}/${this.config.maxAttempts})`);
      await this.wait(this.config.waitInterval);
    }
  }
}

async function main(): Promise<void> {
  try {
    const waiter = new PostgresWaiter();
    await waiter.waitForPostgres();
  } catch (error) {
    console.error('❌ Error waiting for PostgreSQL:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}