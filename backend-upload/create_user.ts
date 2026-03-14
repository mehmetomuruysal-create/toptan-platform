import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@test.com';
    const plainPassword = '1836Mehmet*';

    const userExists = await prisma.user.findUnique({
        where: { email }
    });

    if (userExists) {
        console.log(`User ${email} already exists. Updating password...`);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Password updated for user ${email}`);
    } else {
        console.log(`Creating new user ${email}...`);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Test User',
                role: 'ADMIN', // Giving ADMIN role just in case
                isEmailVerified: true
            }
        });
        console.log(`User created:`, user);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
