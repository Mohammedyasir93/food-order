import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import Food from '../models/Food.js';

const foods = [
  { name: 'Chicken Biryani', description: 'Fragrant basmati rice layered with spiced chicken and fresh herbs.', category: 'Biryani', price: 249, image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Veg Biryani', description: 'Aromatic rice, seasonal vegetables, mint, and toasted cashews.', category: 'Biryani', price: 189, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=85' },
  { name: 'Masala Dosa', description: 'Crisp golden dosa filled with potato masala, served with chutneys.', category: 'South Indian', price: 149, image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85' },
  { name: 'Chicken Burger', description: 'Grilled chicken, lettuce, house sauce, and pickled onion in a toasted bun.', category: 'Burgers', price: 199, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85' },
  { name: 'Margherita Pizza', description: 'Stone-baked crust with tomato, mozzarella, and fragrant basil.', category: 'Pizza', price: 299, image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85' },
  { name: 'Paneer Butter Masala', description: 'Soft paneer in a creamy tomato gravy with warming spices.', category: 'Main Course', price: 229, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=85' },
  { name: 'French Fries', description: 'Crisp, golden fries tossed with sea salt and house seasoning.', category: 'Sides', price: 99, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85' },
  { name: 'Fresh Lime Juice', description: 'Freshly squeezed lime, served sweet or salted and chilled.', category: 'Drinks', price: 69, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?auto=format&fit=crop&w=900&q=85' },
  { name: 'Crispy Chilli Paneer', description: 'Indo-Chinese paneer tossed with peppers, garlic, and spring onion.', category: 'Sides', price: 179, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=85' },
  { name: 'Classic Veg Thali', description: 'A generous plate of dal, seasonal curry, rice, roti, and salad.', category: 'Main Course', price: 219, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85' },
];

try {
  await connectDatabase(process.env.MONGODB_URI);
  for (const food of foods) {
    await Food.updateOne({ name: food.name }, { $set: { ...food, isAvailable: true } }, { upsert: true });
  }
  console.log(`${foods.length} menu items seeded.`);
} catch (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}