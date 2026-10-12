import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderItems } from '../services/orderPricing.js';

const foods = [
  { _id: 'food-a', name: 'Dosa', price: 100, isAvailable: true },
  { _id: 'food-b', name: 'Juice', price: 50, isAvailable: true },
];

test('prices quantities from database food records, not client prices', () => {
  const result = buildOrderItems([
    { foodId: 'food-a', quantity: 2, price: 0 },
    { foodId: 'food-b', quantity: 1, price: 99999 },
  ], foods);
  assert.equal(result.subtotal, 250);
  assert.deepEqual(result.items.map(item => item.price), [100, 50]);
});

test('rejects invalid quantities and unavailable items', () => {
  assert.throws(() => buildOrderItems([{ foodId: 'food-a', quantity: 0 }], foods), /quantities are invalid/);
  assert.throws(() => buildOrderItems([{ foodId: 'food-a', quantity: 1 }], [{ ...foods[0], isAvailable: false }]), /unavailable/);
});

test('rejects duplicate item IDs and a cart with no items', () => {
  assert.throws(() => buildOrderItems([], []), /between 1 and 30/);
  assert.throws(() => buildOrderItems([
    { foodId: 'food-a', quantity: 1 },
    { foodId: 'food-a', quantity: 2 },
  ], [foods[0]]), /quantities are invalid/);
});