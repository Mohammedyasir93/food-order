import { Router } from 'express';
import { createFood, deleteFood, getFood, listFoods, updateFood } from '../controllers/foodController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateFood, validateObjectId } from '../middleware/validators.js';

const router = Router();
router.get('/', asyncHandler(listFoods));
router.get('/:id', validateObjectId, asyncHandler(getFood));
router.post('/', requireAuth, requireAdmin, validateFood, asyncHandler(createFood));
router.put('/:id', requireAuth, requireAdmin, validateObjectId, validateFood, asyncHandler(updateFood));
router.delete('/:id', requireAuth, requireAdmin, validateObjectId, asyncHandler(deleteFood));
export default router;