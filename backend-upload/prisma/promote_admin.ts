import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emails = ['mehmetomuruysal@gmail.com', 'test@test.com'];

    for (const email of emails) {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log(`User ${user.email} promoted to ADMIN.`);
    }
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
