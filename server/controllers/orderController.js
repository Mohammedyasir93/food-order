import mongoose from 'mongoose';
import Food from '../models/Food.js';
import Order from '../models/Order.js';
import { buildOrderItems } from '../services/orderPricing.js';

export async function createOrder(req, res) {
  const { items, customerName, phoneNumber, deliveryAddress, instructions } = req.body;
  if (typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.length > 80) {
    return res.status(400).json({ message: 'Enter the customer name for delivery.' });
  }
  if (typeof phoneNumber !== 'string' || !/^\+?[0-9\s()-]{8,20}$/.test(phoneNumber.trim())) {
    return res.status(400).json({ message: 'Enter a valid phone number.' });
  }
  if (typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 8 || deliveryAddress.length > 500) {
    return res.status(400).json({ message: 'Delivery address must be between 8 and 500 characters.' });
  }
  if (instructions !== undefined && (typeof instructions !== 'string' || instructions.length > 300)) {
    return res.status(400).json({ message: 'Instructions must be 300 characters or fewer.' });
  }

  const ids = Array.isArray(items) ? items.map(item => item?.foodId) : [];
  if (ids.some(id => !mongoose.isValidObjectId(id))) {
    return res.status(400).json({ message: 'One or more cart items are invalid. Please refresh your cart.' });
  }
  const foods = ids.length ? await Food.find({ _id: { $in: ids } }) : [];
  const priced = buildOrderItems(items, foods);
  const order = await Order.create({
    userId: req.user._id,
    customerName: customerName.trim(),
    items: priced.items,
    deliveryAddress: deliveryAddress.trim(),
    phoneNumber: phoneNumber.trim(),
    instructions: instructions?.trim() || '',
    subtotal: priced.subtotal,
    total: priced.subtotal,
    paymentMethod: 'Cash on Delivery',
  });
  res.status(201).json({ order });
}

export async function listMyOrders(req, res) {
  res.json({ orders: await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100) });
}

export async function getMyOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
}