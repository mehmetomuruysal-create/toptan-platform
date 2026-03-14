import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(50, "Ad çok uzun.").regex(/^[^<>]+$/, "Geçersiz karakterler içeriyor."),
    email: z.string().email("Geçerli bir e-posta adresi girin."),
    password: z.string()
        .min(8, "Şifre en az 8 karakter olmalıdır.")
        .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
        .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
        .regex(/[0-9]/, "Şifre en az bir rakam içermelidir.")
        .regex(/[^A-Za-z0-9]/, "Şifre en az bir özel karakter içermelidir."),
    phone: z.string().optional(),
    role: z.enum(['BIREYSEL', 'KOBI', 'KURUMSAL', 'ADMIN']).default('BIREYSEL'),
    companyName: z.string().optional(),
    taxNumber: z.string().optional(),
    taxOffice: z.string().optional(),
    yearlyVolume: z.string().optional()
});

export const loginSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi girin."),
    password: z.string().min(1, "Şifre zorunludur.")
});

export const productCreateSchema = z.object({
    title: z.string().min(3, "Başlık en az 3 karakter olmalıdır."),
    description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır."),
    categoryId: z.string().uuid("Geçerli bir kategori seçin."),
    priceType: z.enum(['FIXED', 'NEGOTIABLE', 'REQUEST_QUOTE']),
    basePrice: z.number().positive("Fiyat pozitif olmalıdır.").optional(),
    currency: z.string().default("TRY"),
    priceUnit: z.string().default("adet"),
    moq: z.number().int().min(1, "Minimum sipariş miktarı en az 1 olmalıdır."),
    stockQuantity: z.number().int().nonnegative().optional(),
    stockVisibility: z.enum(['SHOW_EXACT', 'SHOW_STATUS', 'HIDE', 'SHOW_RANGE']).default('SHOW_STATUS'),
    leadTime: z.string().optional(),
    shippingFrom: z.string().optional(),
    exportAvailable: z.boolean().default(false),
    hsCode: z.string().optional(),
    originCountry: z.string().optional(),
    // İlişkisel veriler (array formatında bekleyebiliriz)
    techSpecs: z.array(z.object({
        key: z.string(),
        value: z.string(),
        unit: z.string().optional()
    })).optional(),
    priceTiers: z.array(z.object({
        minQuantity: z.number().int().min(1),
        maxQuantity: z.number().int().optional(),
        price: z.number().positive()
    })).optional()
});

export const categoryCreateSchema = z.object({
    name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır."),
    slug: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().uuid().optional().nullable()
});

export const categoryUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
    level: z.number().optional()
});
