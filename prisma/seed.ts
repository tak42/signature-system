import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // 開発用のユーザーを作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@signature.local' },
    update: {},
    create: {
      email: 'admin@signature.local',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const approver = await prisma.user.upsert({
    where: { email: 'approver@signature.local' },
    update: {},
    create: {
      email: 'approver@signature.local',
      name: 'Approver User',
      role: 'APPROVER',
    },
  });

  const applicant = await prisma.user.upsert({
    where: { email: 'applicant@signature.local' },
    update: {},
    create: {
      email: 'applicant@signature.local',
      name: 'Applicant User',
      role: 'APPLICANT',
    },
  });

  console.log('✅ Created users:');
  console.log('   - Admin:', adminUser.email);
  console.log('   - Approver:', approver.email);
  console.log('   - Applicant:', applicant.email);
  
  console.log('🌱 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });