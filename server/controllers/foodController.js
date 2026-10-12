import Food from '../models/Food.js';

export async function listFoods(req, res) {
  const filter = {};
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.available === 'true') filter.isAvailable = true;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }
  const sort = req.query.sort === 'price-asc' ? { price: 1 } : req.query.sort === 'price-desc' ? { price: -1 } : { createdAt: -1 };
  res.json({ foods: await Food.find(filter).sort(sort).limit(100) });
}

export async function getFood(req, res) {
  const food = await Food.findById(req.params.id);
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ food });
}

export async function createFood(req, res) {
  res.status(201).json({ food: await Food.create(req.body) });
}

export async function updateFood(req, res) {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ food });
}

export async function deleteFood(req, res) {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ message: 'Food item deleted.' });
}