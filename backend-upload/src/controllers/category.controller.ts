import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { categoryCreateSchema, categoryUpdateSchema } from '../validators/category.validator';

const prisma = new PrismaClient();

// Tüm Aktif Kategorileri Listele
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            status: 'success',
            data: { categories }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Kategoriler alınırken hata oluştu.' });
    }
};

// Kategori Öner (Kullanıcı Tarafından)
export const suggestCategory = async (req: Request, res: Response) => {
    try {
        const validatedData = categoryCreateSchema.parse(req.body);

        // Slug oluştur
        const slug = validatedData.slug || validatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);

        const newCategory = await prisma.category.create({
            data: {
                name: validatedData.name,
                slug,
                icon: validatedData.icon,
                parentId: validatedData.parentId,
                isActive: false, // Varsayılan olarak pasif (onay bekliyor)
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Kategori öneriniz alındı. Admin onayından sonra listede görünecektir.',
            data: { category: newCategory }
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'fail', errors: error.errors });
        }
        res.status(500).json({ status: 'error', message: 'Kategori önerilirken hata oluştu.' });
    }
};

// Kategori Onayla (Sadece Admin)
export const approveCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = categoryUpdateSchema.parse(req.body);

        const updatedCategory = await prisma.category.update({
            where: { id: id as string },
            data: {
                ...validatedData,
                isActive: true // Onaylandığı için aktif et
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Kategori başarıyla onaylandı ve yayına alındı.',
            data: { category: updatedCategory }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Kategori onaylanırken hata oluştu.' });
    }
};
