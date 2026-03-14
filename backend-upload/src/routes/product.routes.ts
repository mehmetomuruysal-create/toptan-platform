import { Router } from 'express';
import { createProduct, getProducts, fetchFromUrl } from '../controllers/product.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getProducts);

// URL'den ürün bilgilerini çek (Yeni!)
router.get('/fetch-url', protect, fetchFromUrl);

// Ürün eklemek için giriş yapmış olmak zorunlu (protect)
router.post('/', protect, createProduct);

export default router;
