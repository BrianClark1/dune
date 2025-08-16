// frontend/app/forms/page.tsx
"use client";
import { useEffect, useState } from "react";

interface Form {
    id: string;
    title: string;
    fields: any[];
    createdAt: string;
}

export default function FormsPage() {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`);
            if (!res.ok) throw new Error('Failed to fetch forms');
            const data = await res.json();
            setForms(data);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading forms...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Published Forms</h1>
                    <a
                        href="/"
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Back to Home
                    </a>
                </div>

                {forms.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-600">No forms published yet</p>
                        <a href="/builder" className="mt-4 inline-block text-blue-500 hover:underline">
                            Create your first form →
                        </a>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.map((form) => (
                            <a
                                key={form.id}
                                href={`/forms/${form.id}`}
                                className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                            >
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">{form.title}</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    {form.fields.length} question{form.fields.length === 1 ? '' : 's'}
                                </p>
                                <time className="text-xs text-gray-500">
                                    Created {new Date(form.createdAt).toLocaleDateString()}
                                </time>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}