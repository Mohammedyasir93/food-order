import { useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function Toast({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;
  return <div className={`toast ${notice.type || 'success'}`} role="status"><span className="toast-icon"><Check size={15} /></span>{notice.message}<button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button></div>;
}