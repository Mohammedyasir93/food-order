import { Router } from 'express';
import { dashboard, listOrders, updateOrderStatus } from '../controllers/adminController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validators.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/dashboard', asyncHandler(dashboard));
router.get('/orders', asyncHandler(listOrders));
router.patch('/orders/:id/status', validateObjectId, asyncHandler(updateOrderStatus));
export default router;