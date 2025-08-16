"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FormBuilderUI, { FormModel } from "../../page";

export default function EditFormPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<FormModel | null>(null);

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

    const updateForm = async (formData: FormModel) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update form');
            alert('Form updated successfully!');
            router.push('/forms');
        } catch (error) {
            console.error('Error updating form:', error);
            alert('Failed to update form');
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
        <div>
            <div className="p-6 flex justify-end">
                <a href="/forms" className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    Back to Forms
                </a>
            </div>
            {console.log('EditFormPage props:', { initialForm: form, isEditMode: true })}
            <FormBuilderUI
                initialForm={form}
                onSave={updateForm}
                isEditMode={true}
            />
        </div>
    );
}