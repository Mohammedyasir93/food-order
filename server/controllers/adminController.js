import Food from '../models/Food.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export async function dashboard(req, res) {
  const [orderCount, foodCount, customerCount, sales] = await Promise.all([
    Order.countDocuments(),
    Food.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);
  res.json({ summary: { orderCount, foodCount, customerCount, totalSales: sales[0]?.total || 0 } });
}

export async function listOrders(req, res) {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200).populate('userId', 'name email');
  res.json({ orders });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!orderStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${orderStatuses.join(', ')}.` });
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
}