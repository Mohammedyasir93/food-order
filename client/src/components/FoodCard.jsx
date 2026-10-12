import { Plus, Star } from 'lucide-react';
import { imageFallback } from '../services/api.js';

export default function FoodCard({ food, onAdd }) {
  return (
    <article className={`food-card ${!food.isAvailable ? 'food-card-unavailable' : ''}`}>
      <div className="food-image-wrap">
        <img src={food.image} alt={food.name} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} />
        <span className="food-category">{food.category}</span>
        <span className="food-rating"><Star size={12} fill="currentColor" /> 4.8</span>
      </div>
      <div className="food-card-copy">
        <div className="food-card-title"><h3>{food.name}</h3><strong>₹{food.price}</strong></div>
        <p>{food.description}</p>
        <div className="food-card-bottom">
          <span className={food.isAvailable ? 'availability' : 'availability unavailable'}>{food.isAvailable ? 'Ready to order' : 'Currently unavailable'}</span>
          <button className="add-button" onClick={() => onAdd(food)} disabled={!food.isAvailable} aria-label={`Add ${food.name} to cart`}><Plus size={18} /></button>
        </div>
      </div>
    </article>
  );
}