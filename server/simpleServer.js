import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';

const app = express();
const port = Number(process.env.PORT) || 5000;
const dataFile = join(dirname(fileURLToPath(import.meta.url)), 'data', 'simple-store.json');
const tokenSecret = process.env.JWT_SECRET || randomBytes(48).toString('hex');
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(origin => origin.trim());
const statuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const starterFoods = [
  ['Chicken Biryani', 'Fragrant basmati rice layered with spiced chicken and herbs.', 249, 'Biryani', 'photo-1563379091339-03246963d96c'],
  ['Veg Biryani', 'Aromatic rice, seasonal vegetables, mint, and toasted cashews.', 189, 'Biryani', 'photo-1589302168068-964664d93dc0'],
  ['Masala Dosa', 'Crisp golden dosa filled with potato masala and served with chutneys.', 149, 'South Indian', 'photo-1668236543090-82eba5ee5976'],
  ['Chicken Burger', 'Grilled chicken, lettuce, house sauce, and pickled onion in a toasted bun.', 199, 'Burgers', 'photo-1568901346375-23c9450c58cd'],
  ['Margherita Pizza', 'Stone-baked crust with tomato, mozzarella, and fragrant basil.', 299, 'Pizza', 'photo-1579751626657-72bc17010498'],
  ['Paneer Butter Masala', 'Soft paneer in a creamy tomato gravy with warming spices.', 229, 'Main Course', 'photo-1631452180519-c014fe946bc7'],
  ['French Fries', 'Crisp, golden fries tossed with sea salt and house seasoning.', 99, 'Sides', 'photo-1573080496219-bb080dd4f877'],
  ['Fresh Lime Juice', 'Freshly squeezed lime, served sweet or salted and chilled.', 69, 'Drinks', 'photo-1513558161293-cdaf765edfd7'],
];

function starterStore() {
  return {
    users: [],
    foods: starterFoods.map(([name, description, price, category, photo]) => ({
      _id: randomUUID(), name, description, price, category,
      image: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`,
      isAvailable: true, createdAt: new Date().toISOString(),
    })),
    orders: [],
  };
}

await mkdir(dirname(dataFile), { recursive: true });
let store;
try {
  store = JSON.parse(await readFile(dataFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  store = starterStore();
  await saveStore();
}

async function saveStore() {
  const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(store, null, 2), 'utf8');
  await rename(temporaryFile, dataFile);
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

function createToken(user) {
  return jwt.sign({ sub: user._id }, tokenSecret, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const value = req.headers.authorization;
  if (!value?.startsWith('Bearer ')) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(value.slice(7), tokenSecret);
    const user = store.users.find(item => item._id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Your session is invalid or has expired.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  next();
}

function validateFood(body) {
  const { name, description, price, category, image, isAvailable } = body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) return 'Food name must be between 2 and 100 characters.';
  if (typeof description !== 'string' || !description.trim() || description.length > 500) return 'A description of up to 500 characters is required.';
  if (!Number.isFinite(Number(price)) || Number(price) < 1 || Number(price) > 100000) return 'Price must be between ₹1 and ₹100,000.';
  if (typeof category !== 'string' || !category.trim() || category.length > 40) return 'A valid category is required.';
  try {
    const url = new URL(image);
    if (!['http:', 'https:'].includes(url.protocol)) return 'Image must be a valid HTTP or HTTPS URL.';
  } catch {
    return 'Image must be a valid HTTP or HTTPS URL.';
  }
  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') return 'Availability must be true or false.';
  return null;
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', storage: 'local-demo' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Password must be between 8 and 72 characters.' });
  const normalizedEmail = email.trim().toLowerCase();
  if (store.users.some(user => user.email === normalizedEmail)) return res.status(409).json({ message: 'An account with that email already exists.' });
  const user = { _id: randomUUID(), name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), role: 'customer', createdAt: new Date().toISOString() };
  store.users.push(user);
  await saveStore();
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' });
  const user = store.users.find(item => item.email === email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: createToken(user), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get('/api/foods', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase().slice(0, 100) : '';
  let foods = store.foods.filter(food => req.query.category === undefined || req.query.category === 'All' || food.category === req.query.category);
  if (req.query.available === 'true') foods = foods.filter(food => food.isAvailable);
  if (search) foods = foods.filter(food => `${food.name} ${food.description} ${food.category}`.toLowerCase().includes(search));
  if (req.query.sort === 'price-asc') foods.sort((a, b) => a.price - b.price);
  if (req.query.sort === 'price-desc') foods.sort((a, b) => b.price - a.price);
  res.json({ foods: foods.slice(0, 100) });
});

app.get('/api/foods/:id', (req, res) => {
  const food = store.foods.find(item => item._id === req.params.id);
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ food });
});

app.post('/api/foods', requireAuth, requireAdmin, async (req, res) => {
  const message = validateFood(req.body || {});
  if (message) return res.status(400).json({ message });
  const food = { ...req.body, name: req.body.name.trim(), description: req.body.description.trim(), category: req.body.category.trim(), price: Number(req.body.price), _id: randomUUID(), createdAt: new Date().toISOString() };
  store.foods.push(food);
  await saveStore();
  res.status(201).json({ food });
});

app.put('/api/foods/:id', requireAuth, requireAdmin, async (req, res) => {
  const index = store.foods.findIndex(item => item._id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Food item not found.' });
  const message = validateFood(req.body || {});
  if (message) return res.status(400).json({ message });
  store.foods[index] = { ...store.foods[index], ...req.body, name: req.body.name.trim(), description: req.body.description.trim(), category: req.body.category.trim(), price: Number(req.body.price) };
  await saveStore();
  res.json({ food: store.foods[index] });
});

app.delete('/api/foods/:id', requireAuth, requireAdmin, async (req, res) => {
  const index = store.foods.findIndex(item => item._id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Food item not found.' });
  store.foods.splice(index, 1);
  await saveStore();
  res.json({ message: 'Food item deleted.' });
});

app.post('/api/orders', requireAuth, async (req, res) => {
  const { items, customerName, phoneNumber, deliveryAddress, instructions } = req.body || {};
  if (typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.length > 80) return res.status(400).json({ message: 'Enter the customer name for delivery.' });
  if (typeof phoneNumber !== 'string' || !/^\+?[0-9\s()-]{8,20}$/.test(phoneNumber.trim())) return res.status(400).json({ message: 'Enter a valid phone number.' });
  if (typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 8 || deliveryAddress.length > 500) return res.status(400).json({ message: 'Delivery address must be between 8 and 500 characters.' });
  if (instructions !== undefined && (typeof instructions !== 'string' || instructions.length > 300)) return res.status(400).json({ message: 'Instructions must be 300 characters or fewer.' });
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) return res.status(400).json({ message: 'Your cart must contain between 1 and 30 different items.' });
  const ids = new Set();
  const pricedItems = [];
  for (const item of items) {
    const food = store.foods.find(entry => entry._id === item?.foodId);
    const quantity = Number(item?.quantity);
    if (!food || !food.isAvailable) return res.status(400).json({ message: 'One or more items are unavailable. Please refresh your cart.' });
    if (ids.has(food._id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return res.status(400).json({ message: 'Cart item quantities are invalid.' });
    ids.add(food._id);
    pricedItems.push({ foodId: food._id, name: food.name, quantity, price: food.price });
  }
  const subtotal = Number(pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const order = {
    _id: randomUUID(), userId: req.user._id, customerName: customerName.trim(), items: pricedItems,
    deliveryAddress: deliveryAddress.trim(), phoneNumber: phoneNumber.trim(), instructions: instructions?.trim() || '',
    subtotal, total: subtotal, paymentMethod: 'Cash on Delivery', paymentStatus: 'Pending', status: 'Pending', createdAt: new Date().toISOString(),
  };
  store.orders.unshift(order);
  await saveStore();
  res.status(201).json({ order });
});

app.get('/api/orders/my-orders', requireAuth, (req, res) => res.json({ orders: store.orders.filter(order => order.userId === req.user._id).slice(0, 100) }));

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = store.orders.find(item => item._id === req.params.id && item.userId === req.user._id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
});

app.use('/api/admin', requireAuth, requireAdmin);
app.get('/api/admin/dashboard', (req, res) => res.json({ summary: {
  orderCount: store.orders.length,
  foodCount: store.foods.length,
  customerCount: store.users.filter(user => user.role === 'customer').length,
  totalSales: store.orders.filter(order => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0),
} }));
app.get('/api/admin/orders', (req, res) => res.json({ orders: store.orders.slice(0, 200).map(order => ({ ...order, userId: publicUser(store.users.find(user => user._id === order.userId) || {}) })) }));
app.patch('/api/admin/orders/:id/status', async (req, res) => {
  const order = store.orders.find(item => item._id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!statuses.includes(req.body?.status)) return res.status(400).json({ message: `Status must be one of: ${statuses.join(', ')}.` });
  order.status = req.body.status;
  await saveStore();
  res.json({ order });
});

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.message);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12) {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  let admin = store.users.find(user => user.email === email);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  if (admin) Object.assign(admin, { name: process.env.ADMIN_NAME?.trim() || admin.name, passwordHash, role: 'admin' });
  else {
    admin = { _id: randomUUID(), name: process.env.ADMIN_NAME?.trim() || 'QuickBite Admin', email, passwordHash, role: 'admin', createdAt: new Date().toISOString() };
    store.users.push(admin);
  }
  await saveStore();
}

app.listen(port, () => {
  console.log(`QuickBite simple demo API listening on http://localhost:${port}`);
  console.log(`Local JSON data: ${dataFile}`);
  if (!process.env.JWT_SECRET) console.log('Using a temporary session secret; sessions reset when the server restarts.');
  if (!store.users.some(user => user.role === 'admin')) console.log('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD (12+ characters) to enable admin access.');
});