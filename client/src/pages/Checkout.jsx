import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';

const money = amount => `₹${Number(amount).toLocaleString('en-IN')}`;

export default function Checkout({ notify }) {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: user?.name || '', phoneNumber: '', deliveryAddress: '', instructions: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/orders', { method: 'POST', body: { ...form, items: items.map(item => ({ foodId: item._id, quantity: item.quantity })) } });
      clearCart();
      notify('Your order is on its way to the kitchen.');
      navigate(`/orders/${result.order._id}`, { state: { justPlaced: true } });
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) return <main className="page-shell"><div className="empty-cart"><span className="empty-cart-icon"><CheckCircle2 size={30} /></span><h2>Your bag is empty.</h2><p>Add a dish before heading to checkout.</p><Link className="button button-orange" to="/menu">Browse the menu <ArrowRight size={17} /></Link></div></main>;

  return <main className="page-shell checkout-shell"><div className="page-title-row"><div><span className="eyebrow">ALMOST AT YOUR DOOR</span><h1>Make it <em>yours.</em></h1></div><Link className="underlined-link" to="/cart"><ArrowLeft size={16} /> Back to bag</Link></div><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><div className="checkout-section-title"><span className="step-number">01</span><div><h2>Delivery details</h2><p>Where should we bring the good stuff?</p></div></div><div className="form-grid"><label>Full name<input required minLength="2" maxLength="80" autoComplete="name" value={form.customerName} onChange={event => setForm({ ...form, customerName: event.target.value })} placeholder="Name for the order" /></label><label>Phone number<input required type="tel" autoComplete="tel" pattern="\+?[0-9\s()\-]{8,20}" value={form.phoneNumber} onChange={event => setForm({ ...form, phoneNumber: event.target.value })} placeholder="+91 98765 43210" /></label><label className="field-full">Delivery address<textarea required minLength="8" maxLength="500" autoComplete="street-address" rows="3" value={form.deliveryAddress} onChange={event => setForm({ ...form, deliveryAddress: event.target.value })} placeholder="House / flat, street, area, city, PIN code" /></label><label className="field-full">Instructions <span className="optional-label">OPTIONAL</span><textarea maxLength="300" rows="2" value={form.instructions} onChange={event => setForm({ ...form, instructions: event.target.value })} placeholder="A gate code, a landmark, or anything we should know" /></label></div><div className="checkout-section-title payment-title"><span className="step-number">02</span><div><h2>Payment</h2><p>Simple, safe, and ready when you are.</p></div></div><div className="payment-option"><span className="radio-dot" /><div><b>Cash on delivery</b><span>Pay when your order reaches you</span></div><span className="cod-tag">AVAILABLE</span></div>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-orange full-button place-order" disabled={busy}>{busy ? 'Placing your order...' : <>Place my order <ArrowRight size={17} /></>}</button><p className="secure-note"><ShieldCheck size={15} /> Your order is protected and your details stay private.</p></form><aside className="summary-panel checkout-summary"><span className="eyebrow">MADE TO ORDER</span><h2>Your good things</h2>{items.map(item => <div className="checkout-item" key={item._id}><span className="checkout-qty">{item.quantity}×</span><span>{item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="summary-line"><span>Subtotal</span><span>{money(total)}</span></div><div className="summary-line"><span>Delivery</span><span className="included">Included</span></div><div className="summary-total"><span>Total due</span><strong>{money(total)}</strong></div><div className="address-hint"><MapPin size={16} /><span>We’ll confirm your delivery details with you if needed.</span></div></aside></div></main>;
}