import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  function logout() {
    signOut();
    close();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" to="/" onClick={close} aria-label="QuickBite home">
          <span className="brand-mark">qb</span><span>quickbite<span className="brand-dot">.</span></span>
        </Link>
        <button className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`nav-links ${open ? 'is-open' : ''}`}>
          <NavLink to="/" onClick={close}>Discover</NavLink>
          <NavLink to="/menu" onClick={close}>Our menu</NavLink>
          {user && <NavLink to="/orders" onClick={close}>My orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          <div className="nav-actions">
            {user ? <><span className="nav-greeting">Hi, {user.name.split(' ')[0]}</span><button className="text-button" onClick={logout}>Sign out</button></> : <Link className="text-button" to="/login" onClick={close}>Sign in <ArrowRight size={15} /></Link>}
            <Link className="cart-link" to="/cart" onClick={close} aria-label={`Cart, ${count} items`}><ShoppingBag size={18} /><span>Cart</span><b>{count}</b></Link>
          </div>
        </nav>
      </div>
    </header>
  );
}