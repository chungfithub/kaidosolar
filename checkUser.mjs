import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!user) {
    const passwordHash = await bcrypt.hash('password', 10);
    user = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log("Created admin user");
  } else {
    console.log("Admin user exists");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
