import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Utensils } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { imageFallback } from '../services/api.js';

export default function Auth({ notify }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const isRegister = location.pathname === '/register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await signIn(form, isRegister ? 'register' : 'login');
      notify(isRegister ? `Welcome to QuickBite, ${user.name.split(' ')[0]}!` : `Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><div className="auth-image"><img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=90" alt="A table set with a freshly prepared meal" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = imageFallback; }} /><Link className="auth-back" to="/"><ArrowLeft size={16} /> Back to QuickBite</Link><div className="auth-image-caption"><Utensils size={18} /><span>Good things are<br /><b>coming to the table.</b></span></div></div><section className="auth-panel"><div className="auth-form-wrap"><span className="eyebrow">{isRegister ? 'A SEAT AT OUR TABLE' : 'GOOD TO SEE YOU AGAIN'}</span><h1>{isRegister ? <>Join the <em>good</em> side.</> : <>Welcome <em>back.</em></>}</h1><p>{isRegister ? 'Create an account and make your next meal a little easier.' : 'Sign in to pick up right where your appetite left off.'}</p><form onSubmit={submit} className="form-stack">{isRegister && <label>Your name<input autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Aanya Sharma" /></label>}<label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<span className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : undefined} maxLength="72" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-orange auth-submit" disabled={busy}>{busy ? 'One moment...' : isRegister ? 'Create my account' : 'Sign in'} <ArrowRight size={17} /></button></form><p className="auth-switch">{isRegister ? 'Already have an account?' : 'New around here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p></div></section></main>;
}