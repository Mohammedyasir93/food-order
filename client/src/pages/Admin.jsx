import { useEffect, useState } from 'react';
import { ArrowRight, Check, ClipboardList, DollarSign, Edit3, LayoutDashboard, Plus, Save, Utensils, X } from 'lucide-react';
import { api, imageFallback } from '../services/api.js';

const statuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const blankFood = { name: '', description: '', price: '', category: 'Main Course', image: '', isAvailable: true };
const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function Admin({ notify }) {
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankFood);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [dashboard, foodData, orderData] = await Promise.all([
        api('/admin/dashboard'), api('/foods'), api('/admin/orders'),
      ]);
      setSummary(dashboard.summary);
      setFoods(foodData.foods);
      setOrders(orderData.orders);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function editFood(food) {
    setEditingId(food._id);
    setForm({ name: food.name, description: food.description, price: food.price, category: food.category, image: food.image, isAvailable: food.isAvailable });
    setTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankFood);
  }

  async function saveFood(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api(editingId ? `/foods/${editingId}` : '/foods', { method: editingId ? 'PUT' : 'POST', body: { ...form, price: Number(form.price) } });
      notify(editingId ? 'Menu item updated.' : 'New dish added to the menu.');
      resetForm();
      await refresh();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(food) {
    try {
      await api(`/foods/${food._id}`, { method: 'PUT', body: { ...food, isAvailable: !food.isAvailable } });
      setFoods(current => current.map(item => item._id === food._id ? { ...item, isAvailable: !item.isAvailable } : item));
      notify(`${food.name} marked ${food.isAvailable ? 'unavailable' : 'available'}.`);
    } catch (problem) { setError(problem.message); }
  }

  async function deleteFood(food) {
    if (!window.confirm(`Remove ${food.name} from the menu?`)) return;
    try {
      await api(`/foods/${food._id}`, { method: 'DELETE' });
      setFoods(current => current.filter(item => item._id !== food._id));
      notify(`${food.name} removed from the menu.`);
      if (editingId === food._id) resetForm();
    } catch (problem) { setError(problem.message); }
  }

  async function changeStatus(orderId, status) {
    try {
      const result = await api(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: { status } });
      setOrders(current => current.map(order => order._id === orderId ? result.order : order));
      notify(`Order status changed to ${status}.`);
    } catch (problem) { setError(problem.message); }
  }

  return <main className="admin-shell"><aside className="admin-sidebar"><div className="admin-side-title"><span className="eyebrow">QUICKBITE</span><h1>Kitchen<br /><em>desk.</em></h1></div><nav className="admin-tabs" aria-label="Admin sections">{[['overview', LayoutDashboard, 'Overview'], ['menu', Utensils, 'Menu'], ['orders', ClipboardList, 'Orders']].map(([key, Icon, label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'admin-tab active' : 'admin-tab'}><Icon size={18} />{label}{key === 'orders' && <b>{orders.filter(order => !['Delivered', 'Cancelled'].includes(order.status)).length}</b>}</button>)}</nav><div className="admin-side-note"><span className="admin-live-dot" /> Admin workspace <span>PRIVATE · ROLE VERIFIED</span></div></aside>
    <section className="admin-content"><div className="admin-topline"><div><span className="eyebrow">RESTAURANT OPERATIONS</span><h2>{tab === 'overview' ? 'At a glance' : tab === 'menu' ? 'Menu management' : 'Order fulfilment'}</h2></div><button className="icon-button refresh-button" onClick={refresh} aria-label="Refresh dashboard"><ArrowRight size={17} /></button></div>{error && <div className="admin-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}{loading ? <div className="loading-state"><span className="spinner" /> Loading your kitchen...</div> : <>
      {tab === 'overview' && <><div className="metric-grid">{[[ClipboardList, 'Total orders', summary?.orderCount, 'All time'], [DollarSign, 'Sales tracked', money(summary?.totalSales), 'Excluding cancelled'], [Utensils, 'Menu items', summary?.foodCount, 'Listed in the kitchen'], [LayoutDashboard, 'Customers', summary?.customerCount, 'Registered accounts']].map(([Icon, label, value, note]) => <article className="metric-card" key={label}><span className="metric-icon"><Icon size={18} /></span><span className="metric-label">{label}</span><strong>{value ?? '—'}</strong><small>{note}</small></article>)}</div><div className="admin-section-head"><div><span className="eyebrow">NEEDS A LOOK</span><h3>Recent orders</h3></div><button className="underlined-link" onClick={() => setTab('orders')}>All orders <ArrowRight size={15} /></button></div><OrderTable orders={orders.slice(0, 5)} onChange={changeStatus} /></>}
      {tab === 'menu' && <><form className="admin-food-form" onSubmit={saveFood}><div className="admin-form-heading"><span className="form-icon"><Utensils size={18} /></span><div><h3>{editingId ? 'Edit this dish' : 'Add a dish'}</h3><p>Keep the menu fresh and accurate.</p></div>{editingId && <button type="button" className="text-button" onClick={resetForm}>Cancel edit</button>}</div><div className="admin-form-grid"><label>Food name<input required minLength="2" maxLength="100" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Crispy chilli paneer" /></label><label>Price in rupees<input required type="number" min="1" max="100000" step="1" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="199" /></label><label>Category<input required maxLength="40" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} placeholder="Main Course" /></label><label>Image URL<input required type="url" value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} placeholder="https://..." /></label><label className="field-full">Description<textarea required maxLength="500" rows="2" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="A little about what makes this dish special" /></label></div><div className="admin-form-footer"><label className="availability-toggle"><input type="checkbox" checked={form.isAvailable} onChange={event => setForm({ ...form, isAvailable: event.target.checked })} /><span className="toggle-track" /><span>Available to order</span></label><button className="button button-orange" disabled={saving}>{saving ? 'Saving...' : editingId ? <><Save size={16} /> Save changes</> : <><Plus size={17} /> Add to menu</>}</button></div></form><div className="admin-section-head"><div><span className="eyebrow">THE CURRENT LINEUP</span><h3>{foods.length} dishes</h3></div></div><div className="admin-food-list">{foods.map(food => <article className="admin-food-row" key={food._id}><img src={food.image} alt="" onError={event => { event.currentTarget.src = imageFallback; }} /><div className="admin-food-info"><b>{food.name}</b><span>{food.category} · {money(food.price)}</span></div><button className={`availability-pill ${food.isAvailable ? 'on' : ''}`} onClick={() => toggleAvailability(food)}>{food.isAvailable ? 'Available' : 'Paused'}</button><button className="icon-button admin-edit" onClick={() => editFood(food)} aria-label={`Edit ${food.name}`}><Edit3 size={16} /></button><button className="admin-delete" onClick={() => deleteFood(food)}>Remove</button></article>)}</div></>}
      {tab === 'orders' && <><div className="admin-section-head orders-admin-title"><div><span className="eyebrow">FROM CART TO DOOR</span><h3>All customer orders</h3></div><span className="order-count-badge">{orders.length} total</span></div><OrderTable orders={orders} onChange={changeStatus} detailed /></>}
    </>}</section></main>;
}

function OrderTable({ orders, onChange, detailed = false }) {
  if (!orders.length) return <div className="empty-state"><h3>No orders just yet.</h3><p>New orders will show up here.</p></div>;
  return <div className="admin-orders">{orders.map(order => <article className="admin-order-row" key={order._id}><div className="admin-order-main"><div className="admin-order-number"><b>#{order._id.slice(-8).toUpperCase()}</b><span>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div><div className="admin-order-customer"><b>{order.customerName}</b><span>{order.userId?.email || order.phoneNumber}</span>{detailed && <span>{order.deliveryAddress}</span>}</div><div className="admin-order-items">{order.items.map(item => `${item.quantity} × ${item.name}`).join(' · ')}</div><strong className="admin-order-total">{money(order.total)}</strong><select value={order.status} onChange={event => onChange(order._id, event.target.value)} aria-label={`Update order ${order._id.slice(-8)} status`}>{statuses.map(status => <option key={status}>{status}</option>)}</select></div></article>)}</div>;
}