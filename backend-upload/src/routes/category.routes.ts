import { Router } from 'express';
import { getCategories, suggestCategory, approveCategory } from '../controllers/category.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Herkes kategorileri görebilir
router.get('/', getCategories);

// Sadece giriş yapmış kullanıcılar kategori önerebilir
router.post('/', protect, suggestCategory);

// Sadece Adminler kategori onaylayabilir
router.patch('/:id/approve', protect, restrictTo('ADMIN'), approveCategory);

export default router;
