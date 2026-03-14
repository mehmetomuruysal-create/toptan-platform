
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const cats = [
        { name: '💻 Elektronik & Bilişim', slug: 'elektronik-bilisim' },
        { name: '🧴 Temizlik & Hijyen', slug: 'temizlik-hijyen' },
        { name: '🖨 Ofis Malzemeleri', slug: 'ofis-malzemeleri' },
        { name: '🏭 Hammadde & Sanayi', slug: 'hammadde-sanayi' }
    ];

    for (const cat of cats) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat
        });
    }
    console.log('Categories seeded!');
}
main().finally(() => prisma.$disconnect());
