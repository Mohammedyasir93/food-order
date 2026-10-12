import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: 50 },
  price: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  items: { type: [orderItemSchema], required: true, validate: items => items.length > 0 },
  deliveryAddress: { type: String, required: true, trim: true, maxlength: 500 },
  phoneNumber: { type: String, required: true, trim: true, maxlength: 20 },
  instructions: { type: String, trim: true, maxlength: 300, default: '' },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['Cash on Delivery'], default: 'Cash on Delivery' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
}, { timestamps: { createdAt: true, updatedAt: true } });

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);