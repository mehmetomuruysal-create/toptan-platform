import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { productCreateSchema } from '../validators/product.validator';
import { scrapeAlibaba } from '../services/scraper.service';

const prisma = new PrismaClient();

// URL'den ürün çekme
export const fetchFromUrl = async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ status: 'fail', message: 'Geçerli bir URL gereklidir.' });
        }

        const data = await scrapeAlibaba(url);
        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message || 'Ürün bilgileri çekilemedi.' });
    }
};

// Ürün (İhale) Oluşturma
export const createProduct = async (req: Request, res: Response) => {
    try {
        // Gelen veriyi Zod ile doğrula
        const validatedData = productCreateSchema.parse(req.body);

        // Kullanıcının yetkisini kontrol et (Sadece KOBI ve KURUMSAL ürün ekleyebilir)
        // Not: req.user, auth.middleware tarafından atanır
        const user = (req as any).user;
        if (!user || (user.role !== 'KOBI' && user.role !== 'KURUMSAL' && user.role !== 'ADMIN')) {
            return res.status(403).json({ status: 'fail', message: 'Ürün listelemek için KOBİ veya Kurumsal hesap gereklidir.' });
        }

        // Slug oluştur (Basit bir çözüm, gerçekte benzersiz olmalı)
        let slug = validatedData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

        // Transaction ile ürünü ve ilişkili verileri aynı anda ekle
        // Onay Tipini Belirle (Partner sistemden geliyorsa otomatik onay, belge yüklendiyse manuel)
        let status = 'PENDING_APPROVAL';
        if (validatedData.approvalType === 'AUTOMATIC') {
            // Eğer URL bilinen bir partner sistemindense otomatik aktif edilebilir
            // Şimdilik basitleştirilmiş mantık:
            status = 'ACTIVE';
        }

        const newProduct = await prisma.product.create({
            data: {
                producerId: user.id,
                title: validatedData.title,
                slug,
                description: validatedData.description,
                categoryId: validatedData.categoryId,
                status, // Yeni status mantığı

                // Yeni Alanlar
                approvalType: validatedData.approvalType,
                documentUrl: validatedData.documentUrl || null,
                notificationPrefs: JSON.stringify(validatedData.notificationPrefs || []),
                targetAmount: validatedData.targetAmount || null,

                // Müzakere/Fiyat
                priceType: validatedData.priceType,
                basePrice: validatedData.basePrice || null,
                currency: validatedData.currency,
                priceUnit: validatedData.priceUnit,
                moq: validatedData.moq,

                // Stok ve Lojistik
                stockQuantity: validatedData.stockQuantity || null,
                stockVisibility: validatedData.stockVisibility,
                leadTime: validatedData.leadTime || null,
                shippingFrom: validatedData.shippingFrom || null,

                // İhracat
                exportAvailable: validatedData.exportAvailable,
                hsCode: validatedData.hsCode || null,
                originCountry: validatedData.originCountry || null,

                // İlişkili tablolar
                TechSpecs: {
                    create: validatedData.techSpecs || []
                },
                PriceTiers: {
                    create: validatedData.priceTiers || []
                }
            },
            include: {
                TechSpecs: true,
                PriceTiers: true
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Ürün (İhale) başarıyla oluşturuldu.',
            data: { product: newProduct }
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'fail', message: 'Doğrulama hatası.', errors: error.errors });
        }
        console.error("Ürün oluşturma hatası:", error);
        res.status(500).json({ status: 'error', message: 'Ürün oluşturulurken bir hata oluştu.' });
    }
};

// Tüm Ürünleri Listeleme (Arama ve Filtreleme dahil edilebilir)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: {
                producer: {
                    select: { name: true, companyName: true }
                },
                category: {
                    select: { name: true, slug: true }
                },
                PriceTiers: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ status: 'success', results: products.length, data: { products } });
    } catch (error) {
        console.error("Ürün listeleme hatası:", error);
        res.status(500).json({ status: 'error', message: 'Ürünler alınırken bir hata oluştu.' });
    }
};
