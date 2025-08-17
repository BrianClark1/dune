"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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
            setForms(data || []);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyFormUrl = async (formId: string, e: React.MouseEvent) => {
        e.preventDefault();
        const url = `${window.location.origin}/submit/${formId}`;
        try {
            await navigator.clipboard.writeText(url);
            alert('Form URL copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy URL');
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
                    <div className="flex gap-4">
                        <a href="/builder" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black">
                            Create Form
                        </a>
                        <a href="/" className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                            Back to Home
                        </a>
                    </div>
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
                            <div key={form.id} className="relative bg-white rounded-xl border border-gray-200 p-6">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={(e) => copyFormUrl(form.id, e)}
                                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                        title="Copy form URL"
                                    >
                                        📋
                                        <span className="sr-only">Copy URL</span>
                                    </button>

                                    <Link
                                        href={`/builder/edit/${form.id}`}
                                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                        title="Edit form"
                                    >
                                        ✏️
                                        <span className="sr-only">Edit</span>
                                    </Link>

                                    <Link
                                        href={`/dashboard/${form.id}`}
                                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                        title="View analytics"
                                    >
                                        📊
                                        <span className="sr-only">Analytics</span>
                                    </Link>
                                </div>

                                <h3 className="font-semibold text-gray-900 mb-2">{form.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {form.fields.length} questions • Created {new Date(form.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}