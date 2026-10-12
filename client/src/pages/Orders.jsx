import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, PackageCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api.js';

const money = amount => `₹${Number(amount).toLocaleString('en-IN')}`;

function OrderCard({ order, detailed = false }) {
  return <article className={`order-card ${detailed ? 'order-detail-card' : ''}`}><div className="order-card-head"><div><span className="order-number">ORDER #{order._id.slice(-8).toUpperCase()}</span><span className="order-date">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></div><span className={`status-pill status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div><div className="order-items">{order.items.map(item => <div key={`${item.foodId}-${item.name}`}><span>{item.quantity} × {item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div>{detailed && <div className="order-delivery"><b>Delivering to {order.customerName}</b><span>{order.phoneNumber}</span><span>{order.deliveryAddress}</span>{order.instructions && <span>Note: {order.instructions}</span>}</div>}<div className="order-card-foot"><span>{order.paymentMethod} <i>·</i> {order.paymentStatus}</span><strong>{money(order.total)}</strong></div></article>;
}

export default function Orders() {
  const { id } = useParams();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const request = id ? api(`/orders/${id}`).then(data => { if (active) setOrder(data.order); }) : api('/orders/my-orders').then(data => { if (active) setOrders(data.orders); });
    request.catch(problem => { if (active) setError(problem.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <main className="page-shell"><div className="loading-state"><span className="spinner" /> Finding your orders...</div></main>;
  if (error) return <main className="page-shell"><div className="empty-cart"><h2>We couldn’t find that order.</h2><p>{error}</p><Link to="/orders" className="button button-orange">Back to my orders</Link></div></main>;
  if (id && order) return <main className="page-shell"><div className="page-title-row"><div><span className="eyebrow">{location.state?.justPlaced ? 'ORDER RECEIVED' : 'YOUR ORDER DETAILS'}</span><h1>{location.state?.justPlaced ? <>That’s a <em>wrap.</em></> : <>Order <em>details.</em></>}</h1><p className="confirmation-copy">{location.state?.justPlaced ? 'The kitchen has your order. Keep this number handy.' : 'Here’s everything on this order.'}</p></div><Link className="underlined-link" to="/orders"><ArrowLeft size={16} /> All orders</Link></div>{location.state?.justPlaced && <div className="confirmation-banner"><PackageCheck size={22} /><span>Your order number is <b>#{order._id.slice(-8).toUpperCase()}</b>. We’re getting started!</span></div>}<div className="order-detail-wrap"><OrderCard order={order} detailed /><Link className="back-menu-link" to="/menu">Find another favourite <ArrowRight size={15} /></Link></div></main>;
  return <main className="page-shell"><div className="page-title-row"><div><span className="eyebrow">GOOD TASTE HAS A HISTORY</span><h1>My <em>orders.</em></h1></div><Link className="underlined-link" to="/menu">Order something new <ArrowRight size={16} /></Link></div>{orders.length ? <div className="orders-list">{orders.map(item => <Link to={`/orders/${item._id}`} key={item._id} className="order-link-card"><OrderCard order={item} /></Link>)}</div> : <div className="empty-cart"><span className="empty-cart-icon"><PackageCheck size={30} /></span><h2>Your story starts with a bite.</h2><p>Once you place your first order, it’ll show up here.</p><Link className="button button-orange" to="/menu">Browse the menu <ArrowRight size={17} /></Link></div>}</main>;
}