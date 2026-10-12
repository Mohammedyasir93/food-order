import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header.jsx';
import Toast from './components/Toast.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Home from './pages/Home.jsx';
import Orders from './pages/Orders.jsx';

function ProtectedRoute({ admin = false }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="full-loading"><span className="spinner" /> Preparing your table...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const [notice, setNotice] = useState(null);
  const notify = message => setNotice({ message, type: 'success' });
  const closeNotice = () => setNotice(null);

  return <><Header /><Routes>
    <Route path="/" element={<Home notify={notify} />} />
    <Route path="/menu" element={<Home notify={notify} />} />
    <Route path="/login" element={<Auth notify={notify} />} />
    <Route path="/register" element={<Auth notify={notify} />} />
    <Route path="/cart" element={<Cart />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/checkout" element={<Checkout notify={notify} />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<Orders />} />
    </Route>
    <Route element={<ProtectedRoute admin />}><Route path="/admin" element={<Admin notify={notify} />} /></Route>
    <Route path="*" element={<main className="page-shell"><h1>Page not found</h1></main>} />
  </Routes><Toast notice={notice} onClose={closeNotice} /></>;
}