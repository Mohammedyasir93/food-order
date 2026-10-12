import mongoose from 'mongoose';

export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid record ID.' });
  }
  next();
}

export function validateFood(req, res, next) {
  const { name, description, price, category, image, isAvailable } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ message: 'Food name must be between 2 and 100 characters.' });
  }
  if (typeof description !== 'string' || !description.trim() || description.length > 500) {
    return res.status(400).json({ message: 'A description of up to 500 characters is required.' });
  }
  if (!Number.isFinite(Number(price)) || Number(price) < 1 || Number(price) > 100000) {
    return res.status(400).json({ message: 'Price must be between ₹1 and ₹100,000.' });
  }
  if (typeof category !== 'string' || !category.trim() || category.length > 40) {
    return res.status(400).json({ message: 'A valid category is required.' });
  }
  try {
    const imageUrl = new URL(image);
    if (!['http:', 'https:'].includes(imageUrl.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ message: 'Image must be a valid HTTP or HTTPS URL.' });
  }
  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
    return res.status(400).json({ message: 'Availability must be true or false.' });
  }
  req.body.name = name.trim();
  req.body.description = description.trim();
  req.body.category = category.trim();
  req.body.image = image.trim();
  req.body.price = Number(price);
  next();
}