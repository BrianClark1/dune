"use client";
import { useEffect, useState } from "react";

interface Form {
    id: string;
    title: string;
    fields: any[];
    createdAt: string;
}

export default function DashboardsPage() {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`);
            if (!res.ok) throw new Error('Failed to fetch forms');
            const data = await res.json();
            setForms(data || []);
        } catch (error) {
            console.error('Error fetching forms:', error);
            setError(error instanceof Error ? error.message : 'Failed to load forms');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading dashboards...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Form Analytics</h1>
                    <a
                        href="/"
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Back to Home
                    </a>
                </div>

                {forms.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-600">No forms available for analytics</p>
                        <a href="/builder" className="mt-4 inline-block text-blue-500 hover:underline">
                            Create your first form →
                        </a>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.map((form) => (
                            <a
                                key={form.id}
                                href={`/dashboard/${form.id}`}
                                className="block group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">{form.title}</h3>
                                    <svg
                                        className="w-5 h-5 text-gray-500 group-hover:text-gray-900"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {form.fields.length} questions • Created {new Date(form.createdAt).toLocaleDateString()}
                                </p>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}