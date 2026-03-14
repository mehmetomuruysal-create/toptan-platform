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
