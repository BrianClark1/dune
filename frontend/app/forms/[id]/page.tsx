"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FormModel, Field } from "../../builder/page";

interface FormResponse {
    [key: string]: string | string[] | number;
}

export default function FormPage() {
    const params = useParams();
    const router = useRouter();
    const [form, setForm] = useState<FormModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<FormResponse>({});

    useEffect(() => {
        fetchForm();
    }, [params.id]);

    const fetchForm = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${params.id}`);
            if (!res.ok) throw new Error('Failed to fetch form');
            const data = await res.json();
            setForm(data);
        } catch (error) {
            console.error('Error fetching form:', error);
            alert('Failed to load form');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${params.id}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            });
            if (!res.ok) throw new Error('Failed to submit form');
            alert('Form submitted successfully!');
            router.push('/forms');
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to submit form');
        }
    };

    const renderField = (field: Field) => {
        switch (field.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        required={field.required}
                        value={answers[field.id] as string || ''}
                        onChange={(e) => setAnswers({...answers, [field.id]: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                );
            case 'multiple_choice':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <label key={option} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={option}
                                    required={field.required}
                                    checked={(answers[field.id] as string) === option}
                                    onChange={(e) => setAnswers({...answers, [field.id]: e.target.value})}
                                    className="h-4 w-4"
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <label key={option} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={(answers[field.id] as string[] || []).includes(option)}
                                    onChange={(e) => {
                                        const current = answers[field.id] as string[] || [];
                                        const updated = e.target.checked
                                            ? [...current, option]
                                            : current.filter(o => o !== option);
                                        setAnswers({...answers, [field.id]: updated});
                                    }}
                                    className="h-4 w-4"
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'rating':
                return (
                    <div className="flex gap-2">
                        {Array.from({length: field.max || 5}, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setAnswers({...answers, [field.id]: num})}
                                className={`h-10 w-10 rounded-lg border ${
                                    answers[field.id] === num
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading form...</div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Form not found</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
                    <a
                        href="/forms"
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        Back to Forms
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {form.fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                            <label className="block font-medium text-gray-900">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}