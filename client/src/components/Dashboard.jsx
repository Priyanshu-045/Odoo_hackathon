// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { useCallback, useEffect, useState } from 'react';
import { Card, Metric, Text, Grid, Title, Badge, Button, Callout } from '@tremor/react';
import AskFinance from './AskFinance.jsx';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const Skeleton = () => <div className="mt-1 h-9 w-28 animate-pulse rounded bg-gray-200" aria-label="Loading" />;

export default function Dashboard({ onLogout }) {
  const [s, setS] = useState({ status: 'loading', data: null, error: '', ms: null });

  const load = useCallback(async () => {
    setS((p) => ({ ...p, status: 'loading', error: '' }));
    const t0 = performance.now();
    try {
      const r = await fetch('/api/dashboard/metrics', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (r.status === 401) return onLogout?.();
      if (r.status === 403) throw new Error('Your role cannot view the executive dashboard (Admin or Staff only).');
      if (!r.ok) throw new Error(`Server returned ${r.status}`);
      setS({ status: 'ready', data: await r.json(), error: '', ms: Math.round(performance.now() - t0) });
    } catch (e) {
      setS({ status: 'error', data: null, ms: null, error: navigator.onLine ? e.message : 'You are offline and no cached metrics exist yet.' });
    }
  }, [onLogout]);
  useEffect(() => { load(); }, [load]);

  const { status, data, error, ms } = s;
  const ready = status === 'ready';
  const isEmpty = ready && data.activeSubscriptions === 0 && data.mrr === 0 && data.overdueInvoices === 0;
  const val = (fmt) => (ready ? <Metric>{fmt}</Metric> : <Skeleton />);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Title>BrightSync Executive Dashboard</Title>
        <div className="flex flex-wrap items-center gap-2">
          {ready && <Badge color={ms < 2000 ? 'emerald' : 'red'}>Loaded in {ms} ms</Badge>}
          <Button size="xs" variant="secondary" onClick={load} loading={status === 'loading'}>Refresh</Button>
          <Button size="xs" variant="light" onClick={onLogout}>Sign out</Button>
        </div>
      </div>

      {status === 'error' && (
        <Callout title="Couldn't load metrics" color="red" className="mb-6">
          {error} <button type="button" className="ml-1 underline" onClick={load}>Retry</button>
        </Callout>
      )}
      {isEmpty && (
        <Callout title="No subscription data yet" color="blue" className="mb-6">
          The database is empty. Run <code>npm run seed</code> in /server, then press Refresh.
        </Callout>
      )}

      <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-4 sm:gap-6">
        <Card decoration="top" decorationColor="blue">
          <Text>Monthly Recurring Revenue</Text>
          {val(inr(data?.mrr ?? 0))}
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Active Subscriptions</Text>
          {val((data?.activeSubscriptions ?? 0).toLocaleString('en-IN'))}
        </Card>
        <Card decoration="top" decorationColor="red" className="md:col-span-2 lg:col-span-1">
          <Text>Overdue Invoices</Text>
          {val((data?.overdueInvoices ?? 0).toLocaleString('en-IN'))}
          {ready && data.overdueInvoices > 0 && <Badge color="red" className="mt-2">{inr(data.overdueAmount)} outstanding</Badge>}
        </Card>
      </Grid>

      <AskFinance />
    </main>
  );
}
