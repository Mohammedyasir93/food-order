import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Clock3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import FoodCard from '../components/FoodCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api, imageFallback } from '../services/api.js';

const categories = ['All', 'Biryani', 'South Indian', 'Burgers', 'Pizza', 'Main Course', 'Sides', 'Drinks'];

export default function Home({ notify }) {
  const [foods, setFoods] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (category !== 'All') query.set('category', category);
    if (sort !== 'featured') query.set('sort', sort);
    setLoading(true);
    api(`/foods?${query.toString()}`)
      .then(data => { if (active) { setFoods(data.foods); setError(''); } })
      .catch(problem => { if (active) setError(problem.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category, sort]);

  useEffect(() => {
    const value = searchParams.get('search') || '';
    setSearch(value);
  }, [searchParams]);

  function add(food) {
    addItem(food);
    notify(`${food.name} added to your bag.`);
  }

  function updateSearch(event) {
    const value = event.target.value;
    setSearch(value);
    setSearchParams(value ? { search: value } : {}, { replace: true });
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEIGHBOURHOOD, SERVED</span>
            <h1>Delicious Food,<br /><em>Delivered</em> to Your Door</h1>
            <p>Good meals make good days. Find your next favourite, made fresh and brought straight to you.</p>
            <form className="hero-search" onSubmit={event => { event.preventDefault(); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <Search size={19} /><input value={search} onChange={updateSearch} placeholder="Search dishes, cravings, flavours..." aria-label="Search food" /><button type="submit">Find food <ArrowRight size={16} /></button>
            </form>
            <div className="hero-proof"><span><Clock3 size={16} /> Fast local delivery</span><i /> <span><ShieldCheck size={16} /> Fresh, every time</span></div>
          </div>
          <div className="hero-art" aria-label="A freshly prepared bowl of food">
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1100&q=90" alt="Colourful fresh meal bowl" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} />
            <div className="hero-sticker"><Sparkles size={15} /><span>Made with<br /><b>a little love</b></span></div>
            <div className="hero-caption"><b>Fresh picks, daily</b><span>Little joys in every bite</span></div>
          </div>
          <span className="hero-scribble" aria-hidden="true">Good food<br />is always a<br />good idea.</span>
        </div>
        <a href="#menu" className="scroll-cue"><ArrowDown size={15} /> SCROLL TO TASTE</a>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div><span className="eyebrow">A FEW LOCAL FAVOURITES</span><h2>Find your <em>craving.</em></h2></div>
          <Link to="/menu" className="underlined-link">View full menu <ArrowRight size={16} /></Link>
        </div>
        <div className="menu-toolbar">
          <div className="category-list" aria-label="Filter food category">{categories.map(item => <button key={item} className={category === item ? 'category-chip active' : 'category-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <label className="sort-control">Sort <select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        </div>
        {loading ? <div className="loading-state"><span className="spinner" /> Finding the good stuff...</div> : error ? <div className="empty-state"><h3>Menu temporarily unavailable</h3><p>{error}. Check that the QuickBite API is running.</p></div> : foods.length ? <div className="food-grid">{foods.map(food => <FoodCard key={food._id} food={food} onAdd={add} />)}</div> : <div className="empty-state"><h3>No bites found</h3><p>Try another search or choose a different category.</p></div>}
      </section>

      <section className="offer-band">
        <div className="offer-copy"><span className="eyebrow">A LITTLE EXTRA ON EVERY ORDER</span><h2>Delivery is<br /><em>on us.</em></h2><p>Every QuickBite order comes with delivery included, with no surprise fee at checkout.</p><Link to="/menu" className="button button-dark">Explore the menu <ArrowRight size={17} /></Link></div>
        <div className="offer-image"><img src="https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=1000&q=85" alt="A colourful spread of freshly cooked food" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} /><div className="offer-note">A little<br /><b>extra delicious</b></div></div>
      </section>
      <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark">qb</span><span>quickbite<span className="brand-dot">.</span></span></Link><span>Good food. Good mood. © 2026 QuickBite</span><Link to="/menu">Made for your appetite <ArrowRight size={14} /></Link></footer>
    </main>
  );
}