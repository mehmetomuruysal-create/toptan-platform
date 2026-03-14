import { z } from 'zod';

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
    approvalType: z.enum(['AUTOMATIC', 'MANUAL']).default('AUTOMATIC'),
    documentUrl: z.string().url().optional(),
    notificationPrefs: z.array(z.enum(['WHATSAPP', 'EMAIL', 'SMS'])).optional(),
    targetAmount: z.number().positive().optional(),
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
export const partnerSystemSchema = z.object({
    name: z.string().min(2),
    baseUrl: z.string().url(),
    isActive: z.boolean().default(true)
});
