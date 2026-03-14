import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { partnerSystemSchema } from '../validators/product.validator';

const prisma = new PrismaClient();

// Onay Bekleyen İhaleler
export const getPendingAuctions = async (req: Request, res: Response) => {
    try {
        const auctions = await prisma.product.findMany({
            where: { status: 'PENDING_APPROVAL' },
            include: { producer: { select: { name: true, email: true, companyName: true } } }
        });
        res.status(200).json({ status: 'success', data: { auctions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Hata oluştu.' });
    }
};

// Aktif İhaleler
export const getActiveAuctions = async (req: Request, res: Response) => {
    try {
        const auctions = await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            include: { producer: { select: { name: true, email: true, companyName: true } } }
        });
        res.status(200).json({ status: 'success', data: { auctions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Hata oluştu.' });
    }
};

// Geçmiş (Kapalı) İhaleler
export const getClosedAuctions = async (req: Request, res: Response) => {
    try {
        const auctions = await prisma.product.findMany({
            where: { status: { in: ['SOLD_OUT', 'COMPLETED', 'EXPIRED'] } },
            include: {
                producer: { select: { name: true, email: true, companyName: true } },
                _count: { select: { TechSpecs: true } } // İlerde katılım sayısı buraya gelecek
            }
        });
        res.status(200).json({ status: 'success', data: { auctions } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Hata oluştu.' });
    }
};

// İhale Onayla
export const approveAuction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const auction = await prisma.product.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });

        // Burada ihaleyi başlatana bildirim gönderilecek (WhatsApp/SMS/Mail)
        // console.log(`İhale Onaylandı: ${id}. Bildirim gönderiliyor...`);

        res.status(200).json({ status: 'success', message: 'İhale onaylandı ve yayına alındı.', data: { auction } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'İhale onaylanırken hata oluştu.' });
    }
};

// Partner Sistemleri Yönetimi (Alibaba vb.)
export const addPartnerSystem = async (req: Request, res: Response) => {
    try {
        const validatedData = partnerSystemSchema.parse(req.body);
        const partner = await prisma.partnerSystem.create({ data: validatedData });
        res.status(201).json({ status: 'success', data: { partner } });
    } catch (error: any) {
        if (error.name === 'ZodError') return res.status(400).json({ status: 'fail', errors: error.errors });
        res.status(500).json({ status: 'error', message: 'Sistem eklenirken hata oluştu.' });
    }
};

export const getPartnerSystems = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.partnerSystem.findMany();
        res.status(200).json({ status: 'success', data: { partners } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Sistemler alınırken hata oluştu.' });
    }
};
