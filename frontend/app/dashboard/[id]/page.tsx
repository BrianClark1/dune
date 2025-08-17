"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type FieldType = "text" | "multiple_choice" | "checkbox" | "rating";
type Field = { id: string; type: FieldType; label: string; required: boolean; options?: string[]; max?: number };
type FormModel = { id?: string; title: string; fields: Field[]; createdAt: string };

type Analytics = {
    formId: string;
    byField: Record<string, Record<string, number>>;
    at: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL || ""; // if you use next rewrites, leave empty and call /api/...

export default function DashboardPage() {
    const params = useParams();
    const formId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

    const [form, setForm] = useState<FormModel | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const esRef = useRef<EventSource | null>(null);

    // 1) Fetch form + initial analytics snapshot
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [fRes, aRes] = await Promise.all([
                    fetch(`${BASE}/api/forms/${formId}`),
                    fetch(`${BASE}/api/forms/${formId}/analytics`),
                ]);
                if (!fRes.ok) throw new Error(`form ${fRes.status}`);
                if (!aRes.ok) throw new Error(`analytics ${aRes.status}`);
                const [f, a] = await Promise.all([fRes.json(), aRes.json()]);
                if (!cancelled) {
                    setForm(f);
                    setAnalytics(a);
                }
            } catch (e) {
                console.error("load error", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [formId]);

    // 2) Open SSE stream (with fallback on unnamed events)
    useEffect(() => {
        if (!formId) return;

        const es = new EventSource(`${BASE}/api/forms/${formId}/analytics/stream`);
        esRef.current = es;

        const onAnalytics = (e: MessageEvent) => {
            try { setAnalytics(JSON.parse(e.data)); } catch (_) {}
        };

        es.addEventListener("analytics", onAnalytics);
        es.onmessage = onAnalytics;     // fallback if server emits default "message"
        es.onerror = (err) => {
            console.warn("SSE error; reconnecting soon…", err);
            es.close();
            // a simple reconnect; you can add backoff if you like
            setTimeout(() => {
                if (esRef.current === es) esRef.current = null;
            }, 1000);
        };

        return () => es.close();
    }, [formId]);

    if (loading) {
        return <Shell><Empty>Loading analytics…</Empty></Shell>;
    }
    if (!form || !analytics) {
        return <Shell><Empty>No data available</Empty></Shell>;
    }

    return (
        <Shell>
            <header className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{form.title} — Analytics</h1>
                    <p className="text-gray-500 text-sm">Live as of {new Date(analytics.at).toLocaleTimeString()}</p>
                </div>
            </header>

            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {form.fields.map((field) => {
                    const data = analytics.byField[field.id];
                    if (!data) return null;
                    switch (field.type) {
                        case "rating":
                            return <RatingPanel key={field.id} field={field} data={data} />;
                        case "multiple_choice":
                        case "checkbox":
                            return <ChoicePanel key={field.id} field={field} data={data} />;
                        case "text":
                            return <TextPanel key={field.id} field={field} data={data as any} />;
                        default:
                            return null;
                    }
                })}
            </section>
        </Shell>
    );
}

/* ---------- UI bits ---------- */
function Shell({ children }: { children: React.ReactNode }) {
    return <main className="min-h-screen p-8"><div className="max-w-6xl mx-auto">{children}</div></main>;
}
function Empty({ children }: { children: React.ReactNode }) {
    return <div className="grid place-items-center h-[60vh] text-gray-600">{children}</div>;
}

/* ---------- Panels ---------- */
function RatingPanel({ field, data }: { field: Field; data: Record<string, number> }) {
    const avg = data.avg ?? 0;
    const dist = useMemo(
        () => Object.entries(data)
            .filter(([k]) => k.startsWith("dist_"))
            .map(([k, v]) => ({ rating: Number(k.slice(5)), count: Number(v) }))
            .sort((a, b) => a.rating - b.rating),
        [data]
    );
    const maxCount = Math.max(1, ...dist.map(d => d.count)); // avoid /0

    return (
        <Card title={field.label} subtitle={`Avg ${avg.toFixed(1)} / ${field.max ?? 5}`}>
            <div className="space-y-2">
                {dist.map(({ rating, count }) => (
                    <BarRow key={rating} label={`${rating}`} value={count} max={maxCount} />
                ))}
            </div>
        </Card>
    );
}

function ChoicePanel({ field, data }: { field: Field; data: Record<string, number> }) {
    const opts = field.options ?? [];
    const counts = opts.map(o => data[o] ?? 0);
    const total = counts.reduce((a, b) => a + b, 0);
    const maxCount = Math.max(1, ...counts);

    return (
        <Card title={field.label} subtitle="Distribution">
            <div className="space-y-3">
                {opts.map((o, i) => (
                    <div key={o}>
                        <div className="flex justify-between text-sm">
                            <span>{o}</span>
                            <span className="text-gray-500">{counts[i]} resp{counts[i] === 1 ? "" : "s"}{total ? ` (${Math.round(counts[i] / total * 100)}%)` : ""}</span>
                        </div>
                        <Progress value={counts[i]} max={maxCount} />
                    </div>
                ))}
            </div>
        </Card>
    );
}

function TextPanel({ field, data }: { field: Field; data: { responses: number } }) {
    return (
        <Card title={field.label} subtitle="Text answers">
            <div className="text-3xl font-semibold">{data.responses}</div>
            <div className="text-sm text-gray-500">responses</div>
        </Card>
    );
}

/* ---------- tiny components ---------- */
function Card({ title, subtitle, children }:{ title:string; subtitle?:string; children:React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3">
                {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {children}
        </div>
    );
}
function Progress({ value, max }:{ value:number; max:number }) {
    const pct = max ? (value / max) * 100 : 0;
    return (
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
    );
}
function BarRow({ label, value, max }:{ label:string; value:number; max:number }) {
    const pct = max ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 text-sm text-gray-600">{label}</div>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="w-10 text-right text-sm text-gray-600">{value}</div>
        </div>
    );
}
