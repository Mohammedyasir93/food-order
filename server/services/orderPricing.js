export function buildOrderItems(requestedItems, foods) {
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 30) {
    const error = new Error('Your cart must contain between 1 and 30 different items.');
    error.status = 400;
    throw error;
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    const id = String(item.foodId ?? '');
    const quantity = Number(item.quantity);
    if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 50 || quantities.has(id)) {
      const error = new Error('Cart item quantities are invalid.');
      error.status = 400;
      throw error;
    }
    quantities.set(id, quantity);
  }

  if (foods.length !== quantities.size || foods.some(food => !food.isAvailable)) {
    const error = new Error('One or more items are unavailable. Please refresh your cart.');
    error.status = 400;
    throw error;
  }

  const items = foods.map(food => ({
    foodId: food._id,
    name: food.name,
    quantity: quantities.get(String(food._id)),
    price: food.price,
  }));
  const subtotal = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  return { items, subtotal };
}