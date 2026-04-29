
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        name: 'Administrator',
        role: 'ADMIN',
        status: 'active',
      }
    });
    console.log('Admin user created: admin / 123456');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

