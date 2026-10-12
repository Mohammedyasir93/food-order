import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'quickbite_cart';

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(items)), [items]);

  function addItem(food) {
    setItems(current => {
      const existing = current.find(item => item._id === food._id);
      if (existing) return current.map(item => item._id === food._id ? { ...item, quantity: Math.min(50, item.quantity + 1) } : item);
      return [...current, { _id: food._id, name: food.name, price: food.price, image: food.image, quantity: 1 }];
    });
  }

  function setQuantity(id, quantity) {
    setItems(current => quantity < 1 ? current.filter(item => item._id !== id) : current.map(item => item._id === id ? { ...item, quantity: Math.min(50, quantity) } : item));
  }

  function clearCart() {
    setItems([]);
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <CartContext.Provider value={{ items, count, total, addItem, setQuantity, clearCart }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);