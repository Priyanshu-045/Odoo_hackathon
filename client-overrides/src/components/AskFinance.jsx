// Author: Priyanshu Pandey | Enrollment: 0801e1241068
import { useState } from 'react';
import { Card, Title, Text, TextInput, Button, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Accordion, AccordionHeader, AccordionBody, Callout } from '@tremor/react';

const EXAMPLES = ['What is the total revenue for active yearly plans?', 'How many active subscriptions per plan?', 'Total overdue invoice amount'];
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN') : v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));

export default function AskFinance() {
  const [q, setQ] = useState('');
  const [st, setSt] = useState({ loading: false, error: '', data: null });

  async function ask(text = q) {
    if (!text.trim() || st.loading) return;
    setQ(text);
    setSt({ loading: true, error: '', data: null });
    try {
      const r = await fetch('/api/finance/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ query: text }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(r.status === 429 ? (body.error || 'Rate limit reached. Try again in a minute.') : (body.error || 'Request failed'));
      setSt({ loading: false, error: '', data: body });
    } catch (e) {
      setSt({ loading: false, data: null, error: navigator.onLine ? e.message : 'You are offline. AI queries need a connection.' });
    }
  }

  const rows = st.data?.results ?? [];
  const allKeys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cols = allKeys.length > 1 ? allKeys.filter((k) => k !== '_id') : allKeys;

  return (
    <Card className="mt-6">
      <Title>Ask your finance data</Title>
      <Text className="mb-3">Ask in plain English. Gemini writes a read-only query and we run it against your data.</Text>

      <div className="flex flex-col gap-2 sm:flex-row">
        <TextInput className="flex-1" value={q} onValueChange={setQ} placeholder="e.g. total revenue for active yearly plans" onKeyDown={(e) => e.key === 'Enter' && ask()} />
        <Button loading={st.loading} onClick={() => ask()} className="w-full sm:w-auto">Ask</Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => <Button key={ex} size="xs" variant="secondary" disabled={st.loading} onClick={() => ask(ex)}>{ex}</Button>)}
      </div>

      {st.error && <Callout title="Couldn't answer that" color="red" className="mt-4">{st.error}</Callout>}

      {st.data && (
        <div className="mt-4">
          {rows.length === 0 ? (
            <Callout title="No matching data" color="amber">
              The query ran but returned nothing. If you haven't seeded yet, run <code>npm run seed</code> in /server.
            </Callout>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead><TableRow>{cols.map((c) => <TableHeaderCell key={c}>{c}</TableHeaderCell>)}</TableRow></TableHead>
                <TableBody>{rows.map((r, i) => <TableRow key={i}>{cols.map((c) => <TableCell key={c}>{fmt(r[c])}</TableCell>)}</TableRow>)}</TableBody>
              </Table>
            </div>
          )}
          <Accordion className="mt-4">
            <AccordionHeader>Generated pipeline · {st.data.collection} · {st.data.ms} ms</AccordionHeader>
            <AccordionBody>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(st.data.pipeline, null, 2)}</pre>
            </AccordionBody>
          </Accordion>
        </div>
      )}
    </Card>
  );
}
