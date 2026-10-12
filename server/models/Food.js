import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 1, max: 100000 },
  category: { type: String, required: true, trim: true, maxlength: 40 },
  image: { type: String, required: true, trim: true, maxlength: 1000 },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

foodSchema.index({ category: 1, isAvailable: 1 });
foodSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Food', foodSchema);