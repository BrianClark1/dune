// "use client";
// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import type { FormModel, Field } from "../../builder/page";
//
// interface Analytics {
//     formId: string;
//     byField: {
//         [key: string]: {
//             [key: string]: number;
//         };
//     };
//     at: string;
// }
//
// function RatingPanel({ field, data }: { field: Field; data: { [key: string]: number } }) {
//     const avg = data.avg || 0;
//     const distribution = Object.entries(data)
//         .filter((entry): entry is [string, number] => entry[0].startsWith('dist_'))
//         .map(([k, v]) => ({ rating: parseInt(k.replace('dist_', '')), count: v }))
//         .sort((a, b) => a.rating - b.rating);
//
//     const maxCount = Math.max(...distribution.map(d => d.count));
//
//     return (
//         <div className="p-6 bg-white rounded-xl border border-gray-200">
//             <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
//             <div className="text-3xl font-bold text-gray-900 mb-6">
//                 {avg.toFixed(1)} <span className="text-sm text-gray-500">avg rating</span>
//             </div>
//             <div className="space-y-2">
//                 {distribution.map(({ rating, count }) => (
//                     <div key={rating} className="space-y-1">
//                         <div className="flex justify-between text-sm">
//                             <span>{rating} stars</span>
//                             <span className="text-gray-500">{count} responses</span>
//                         </div>
//                         <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
//                             <div
//                                 className="h-full bg-blue-500 transition-all duration-500"
//                                 style={{ width: `${(count / maxCount) * 100}%` }}
//                             />
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
//
// function ChoicePanel({ field, data }: { field: Field; data: { [key: string]: number } }) {
//     const total = Object.values(data).reduce((sum, v) => sum + v, 0);
//     const maxCount = Math.max(...Object.values(data));
//
//     return (
//         <div className="p-6 bg-white rounded-xl border border-gray-200">
//             <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
//             <div className="space-y-3">
//                 {field.options?.map(option => {
//                     const count = data[option] || 0;
//                     const percentage = total ? Math.round((count / total) * 100) : 0;
//
//                     return (
//                         <div key={option} className="space-y-1">
//                             <div className="flex justify-between text-sm">
//                                 <span>{option}</span>
//                                 <span className="text-gray-500">{percentage}%</span>
//                             </div>
//                             <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
//                                 <div
//                                     className="h-full bg-blue-500 transition-all duration-500"
//                                     style={{ width: `${(count / maxCount) * 100}%` }}
//                                 />
//                             </div>
//                             <div className="text-sm text-gray-500">{count} responses</div>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// }
//
// function TextPanel({ field, data }: { field: Field; data: { responses: number } }) {
//     return (
//         <div className="p-6 bg-white rounded-xl border border-gray-200">
//             <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
//             <div className="text-3xl font-bold text-gray-900">
//                 {data.responses}
//                 <span className="text-sm text-gray-500 ml-2">responses</span>
//             </div>
//         </div>
//     );
// }
//
// export default function DashboardPage() {
//     const params = useParams();
//     const [form, setForm] = useState<FormModel | null>(null);
//     const [analytics, setAnalytics] = useState<Analytics | null>(null);
//     const [loading, setLoading] = useState(true);
// }

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { FormModel, Field } from "../../builder/page";

interface Analytics {
    formId: string;
    byField: {
        [key: string]: {
            [key: string]: number;
        };
    };
    at: string;
}

function RatingPanel({ field, data }: { field: Field; data: { [key: string]: number } }) {
    const avg = data.avg || 0;
    const distribution = Object.entries(data)
        .filter((entry): entry is [string, number] => entry[0].startsWith('dist_'))
        .map(([k, v]) => ({ rating: parseInt(k.replace('dist_', '')), count: v }))
        .sort((a, b) => a.rating - b.rating);

    const maxCount = Math.max(...distribution.map(d => d.count));

    return (
        <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-6">
                {avg.toFixed(1)} <span className="text-sm text-gray-500">avg rating</span>
            </div>
            <div className="space-y-2">
                {distribution.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-2">
                        <div className="w-8 text-sm text-gray-600">{rating}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                        </div>
                        <div className="w-12 text-sm text-gray-600">{count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChoicePanel({ field, data }: { field: Field; data: { [key: string]: number } }) {
    const total = Object.values(data).reduce((sum, v) => sum + v, 0);
    const maxCount = Math.max(...Object.values(data));

    return (
        <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
            <div className="space-y-3">
                {field.options?.map(option => {
                    const count = data[option] || 0;
                    const percentage = total ? Math.round((count / total) * 100) : 0;

                    return (
                        <div key={option} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{option}</span>
                                <span className="text-gray-500">{count} responses ({percentage}%)</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TextPanel({ field, data }: { field: Field; data: { responses: number } }) {
    return (
        <div className="p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">{field.label}</h3>
            <div className="text-3xl font-bold text-gray-900">
                {data.responses}
                <span className="text-sm text-gray-500 ml-2">responses</span>
            </div>
        </div>
    );
}
export default function DashboardPage() {
    const params = useParams();
    const [form, setForm] = useState<FormModel | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('Fetching form with ID:', params.id);
        fetchForm();
    }, []);

    useEffect(() => {
        console.log('Form data changed:', form);
        if (!form) return;

        console.log('Setting up EventSource for form:', params.id);
        const events = new EventSource(
            `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${params.id}/analytics/stream`
        );

        events.addEventListener('analytics', (e: MessageEvent) => {
            console.log('Received analytics event:', e.data);
            const parsedData = JSON.parse(e.data);
            setAnalytics(parsedData);
        });

        events.onerror = (error) => {
            console.error('EventSource error:', error);
        };

        return () => events.close();
    }, [form, params.id]);

    const fetchForm = async () => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${params.id}`;
            console.log('Fetching form from:', url);

            const res = await fetch(url);
            console.log('Fetch response:', res.status, res.statusText);

            if (!res.ok) throw new Error('Failed to fetch form');
            const data = await res.json();
            console.log('Fetched form data:', data);
            setForm(data);
        } catch (error) {
            console.error('Error in fetchForm:', error);
            alert('Failed to load form');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading analytics...</div>
            </div>
        );
    }

    if (!form || !analytics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">No data available</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{form.title} Analytics</h1>
                    <a
                        href="/dashboard"
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </a>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {form.fields.map((field) => {
                        const data = analytics.byField[field.id];
                        if (!data) return null;

                        switch (field.type) {
                            case 'rating':
                                return <RatingPanel key={field.id} field={field} data={data} />;
                            case 'multiple_choice':
                            case 'checkbox':
                                return <ChoicePanel key={field.id} field={field} data={data} />;
                            case 'text':
                                return <TextPanel key={field.id} field={field} data={data} />;
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        </main>
    );
}