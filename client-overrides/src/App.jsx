// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { useCallback, useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [token, setToken] = useState(() => { try { return localStorage.getItem('token'); } catch { return null; } });
  const login = useCallback((t) => { localStorage.setItem('token', t); setToken(t); }, []);
  const logout = useCallback(() => { localStorage.removeItem('token'); setToken(null); }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex-1">{token ? <Dashboard onLogout={logout} /> : <Login onLogin={login} />}</div>
      <Footer />
    </div>
  );
}
