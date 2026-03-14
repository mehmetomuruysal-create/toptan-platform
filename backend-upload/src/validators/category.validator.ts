import { z } from 'zod';

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
