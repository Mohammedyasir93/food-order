import { Router } from 'express';
import { createOrder, getMyOrder, listMyOrders } from '../controllers/orderController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validators.js';

const router = Router();
router.use(requireAuth);
router.post('/', asyncHandler(createOrder));
router.get('/my-orders', asyncHandler(listMyOrders));
router.get('/:id', validateObjectId, asyncHandler(getMyOrder));
export default router;