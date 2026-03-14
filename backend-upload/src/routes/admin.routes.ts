import { Router } from 'express';
import { getPendingAuctions, getActiveAuctions, getClosedAuctions, approveAuction, addPartnerSystem, getPartnerSystems } from '../controllers/admin.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Sadece Adminler bu endpointlere erişebilir
router.use(protect, restrictTo('ADMIN'));

router.get('/auctions/pending', getPendingAuctions);
router.get('/auctions/active', getActiveAuctions);
router.get('/auctions/closed', getClosedAuctions);
router.patch('/auctions/:id/approve', approveAuction);

router.post('/partners', addPartnerSystem);
router.get('/partners', getPartnerSystems);

export default router;
