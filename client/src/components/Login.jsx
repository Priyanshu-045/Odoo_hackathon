// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { useState } from 'react';
import { Card, Title, Text, TextInput, Button, Callout } from '@tremor/react';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;   // mirrors the server rule

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (mode === 'signup' && !PASSWORD_RE.test(f.password))
      return setErr('Password needs 8+ characters with an uppercase letter, a lowercase letter and a special character.');
    setBusy(true);
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'Request failed');
      onLogin(body.token);
    } catch (e2) {
      setErr(navigator.onLine ? e2.message : 'You are offline. Sign in needs a connection.');
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <Title>BrightSync</Title>
        <Text className="mb-4">{mode === 'login' ? 'Sign in to your account' : 'Create a customer account'}</Text>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && <TextInput placeholder="Full name" value={f.name} onValueChange={set('name')} />}
          <TextInput type="email" placeholder="Email" value={f.email} onValueChange={set('email')} autoComplete="email" />
          <TextInput type="password" placeholder="Password" value={f.password} onValueChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {err && <Callout title="Error" color="red">{err}</Callout>}
          <Button type="submit" loading={busy} className="w-full">{mode === 'login' ? 'Sign in' : 'Sign up'}</Button>
        </form>
        <button type="button" className="mt-4 text-sm text-blue-600 underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </Card>
    </main>
  );
}
