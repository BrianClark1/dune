"use client";
import { useMemo, useState, useEffect } from "react";


// ---------- Types ----------
export type FieldType = "text" | "multiple_choice" | "checkbox" | "rating";

export interface Field {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    options?: string[]; // for MC/Checkbox
    max?: number; // for rating
}

export interface FormModel {
    title: string;
    fields: Field[];
}

// ---------- Helpers ----------
const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const emptyForm: FormModel = { title: "Untitled Form", fields: [] };

// Add to the existing props
interface FormBuilderProps {
    initialForm?: FormModel;
    onSave?: (form: FormModel) => Promise<void>;
    isEditMode?: boolean;
}

// ---------- UI ----------
function FormBuilderUI({ initialForm, onSave, isEditMode = false }: FormBuilderProps) {
    // Rest of the component code...
    console.log('FormBuilderUI received props:', { initialForm, onSave, isEditMode });
    const [form, setForm] = useState<FormModel>({ ...emptyForm });
    const [draftId, setDraftId] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    // inputs for the field composer
    const [ftype, setFtype] = useState<FieldType>("text");
    const [flabel, setFlabel] = useState("");
    const [frequired, setFrequired] = useState(false);
    const [foptions, setFoptions] = useState<string[]>([]);
    const [foptionInput, setFoptionInput] = useState("");
    const [fratingMax, setFratingMax] = useState<number>(5);


    // Only load from localStorage if we're not in edit mode
    useEffect(() => {
        if (!isEditMode) {
            const drafts = Object.keys(localStorage)
                .filter(key => key.startsWith('form_'));
            if (drafts.length > 0) {
                const saved = localStorage.getItem(drafts[0]);
                if (saved) {
                    setForm(JSON.parse(saved));
                    setDraftId(drafts[0].replace('form_', ''));
                }
            }
        }
    }, [isEditMode]);

    // Update form when initialForm changes
    useEffect(() => {
        if (initialForm) {
            setForm(initialForm);
        }
    }, [initialForm]);

    const canAdd = useMemo(() => {
        if (!flabel.trim()) return false;
        if (ftype === "multiple_choice" || ftype === "checkbox") {
            return foptions.length > 0;
        }
        if (ftype === "rating") {
            return fratingMax >= 2;
        }
        return true;
    }, [flabel, ftype, foptions, fratingMax]);

    const resetComposer = () => {
        setFtype("text");
        setFlabel("");
        setFrequired(false);
        setFoptions([]);
        setFoptionInput("");
        setFratingMax(5);
    };

    const addField = () => {
        if (!canAdd) return;
        const base: Field = {
            id: newId(),
            type: ftype,
            label: flabel.trim() || "Untitled question",
            required: frequired,
        };
        if (ftype === "multiple_choice" || ftype === "checkbox") base.options = [...foptions];
        if (ftype === "rating") base.max = fratingMax;
        setForm((f) => ({ ...f, fields: [...f.fields, base] }));
        resetComposer();
    };

    const removeField = (id: string) => setForm((f) => ({ ...f, fields: f.fields.filter((x) => x.id !== id) }));

    const clearAll = () => {
        setForm({ ...emptyForm });
        setDraftId(null);
        resetComposer();
    };

    // const saveDraft = async () => {
    //     try {
    //         const res = await fetch("/api/forms", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify(form),
    //         });
    //         if (!res.ok) throw new Error(await res.text());
    //         const data = await res.json();
    //         setDraftId(data.id || data._id || null);
    //     } catch (e) {
    //         console.error(e);
    //         alert(`Save failed: ${e}`);
    //     }
    // };

    const saveDraft = () => {
        try {
            const id = draftId || `draft_${newId()}`;
            localStorage.setItem(`form_${id}`, JSON.stringify(form));
            setDraftId(id);
            alert('Draft saved successfully!');
        } catch (e) {
            console.error(e);
            alert(`Save failed: ${e}`);
        }
    };

    // const publishForm = async () => {
    //     try {
    //         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ ...form, published: true }),
    //         });
    //         if (!res.ok) throw new Error(await res.text());
    //         const data = await res.json();
    //         setDraftId(data.id);
    //         alert('Form published successfully!');
    //     } catch (e) {
    //         console.error(e);
    //         alert(`Publish failed: ${e}`);
    //     }
    // };

    const publishForm = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, published: true }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setDraftId(data.id);
            alert('Form published successfully!');
        } catch (e) {
            console.error(e);
            alert('Publish failed: ${e}');
        }
    };

    const saveChanges = async () => {
        try {
            if (onSave) {
                await onSave(form);
                // alert('Changes saved successfully!');
            }
        } catch (e) {
            console.error(e);
            alert(`Save failed: ${e}`);
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="mx-auto max-w-6xl p-6">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                        <input
                            value={form.title}
                            onChange={(e) => setForm((f) => ({...f, title: e.target.value}))}
                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-lg font-semibold shadow-sm outline-none focus:border-gray-400"
                            placeholder="Form title"
                        />
                        {draftId && (
                            <p className="mt-1 text-sm text-gray-500">Saved as ID: <span
                                className="font-mono">{draftId}</span></p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!isEditMode && (
                            <>
                                <button onClick={saveDraft}
                                        className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-100">
                                    Save draft
                                </button>
                                <button onClick={clearAll}
                                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50">
                                    Clear
                                </button>
                                <button onClick={publishForm}
                                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black">
                                    Publish
                                </button>
                            </>
                        )}
                        {isEditMode && (
                            <button onClick={saveChanges}
                                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black">
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Builder column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Field composer */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Add a
                                question</p>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <select value={ftype} onChange={(e) => setFtype(e.target.value as FieldType)}
                                        className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 focus:outline-none focus:ring-0 sm:w-48">
                                    <option value="text">Text</option>
                                    <option value="multiple_choice">Multiple choice</option>
                                    <option value="checkbox">Checkboxes</option>
                                    <option value="rating">Rating</option>
                                </select>

                                <input value={flabel} onChange={(e) => setFlabel(e.target.value)}
                                       className="h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3"
                                       placeholder="Question label" />

                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input type="checkbox" checked={frequired} onChange={(e) => setFrequired(e.target.checked)} className="h-4 w-4" />
                                    Required
                                </label>
                            </div>

                            {/* Per-type controls */}
                            {ftype === "multiple_choice" || ftype === "checkbox" ? (
                                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex gap-2">
                                        <input
                                            value={foptionInput}
                                            onChange={(e) => setFoptionInput(e.target.value)}
                                            className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3"
                                            placeholder="Add an option and press Enter"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && foptionInput.trim()) {
                                                    e.preventDefault();
                                                    if (!foptions.includes(foptionInput.trim())) setFoptions([...foptions, foptionInput.trim()]);
                                                    setFoptionInput("");
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                if (foptionInput.trim() && !foptions.includes(foptionInput.trim())) setFoptions([...foptions, foptionInput.trim()]);
                                                setFoptionInput("");
                                            }}
                                            className="h-10 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-black"
                                        >Add</button>
                                    </div>
                                    {foptions.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {foptions.map((opt) => (
                                                <span key={opt} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm">
                          {opt}
                                                    <button onClick={() => setFoptions(foptions.filter((o) => o !== opt))} className="text-gray-500 hover:text-gray-700">×</button>
                        </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {ftype === "rating" ? (
                                <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    <label className="text-sm text-gray-700">Max stars</label>
                                    <input type="number" min={2} max={10} value={fratingMax}
                                           onChange={(e) => setFratingMax(parseInt(e.target.value || "5", 10))}
                                           className="h-10 w-24 rounded-lg border border-gray-300 bg-white px-3"/>
                                </div>
                            ) : null}

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={addField}
                                    disabled={!canAdd}
                                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm enabled:hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                                >Add question</button>
                            </div>
                        </div>
                        {/* Existing fields */}
                        <div className="space-y-3">
                            {form.fields.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                                    No questions yet. Add your first one above.
                                </div>
                            )}

                            {form.fields.map((fld, idx) => (
                                <div key={fld.id}
                                     draggable
                                     onDragStart={() => setDragIndex(idx)}
                                     onDragOver={(e) => e.preventDefault()}
                                     onDrop={(e) => {
                                         e.preventDefault();
                                         if (dragIndex === null || dragIndex === idx) return;
                                         const newFields = [...form.fields];
                                         const [moved] = newFields.splice(dragIndex, 1);
                                         newFields.splice(idx, 0, moved);
                                         setForm(f => ({ ...f, fields: newFields }));
                                         setDragIndex(null);
                                     }}
                                     className={`flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm cursor-move ${
                                         dragIndex === idx ? 'opacity-50' : ''
                                     }`}>
                                    <div className="mt-2 select-none rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {prettyType(fld.type)}
                    </span>
                                            {fld.required && (
                                                <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                            Required
                        </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-base font-medium">{fld.label}</p>
                                        {Array.isArray(fld.options) && fld.options.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {fld.options.map((o) => (
                                                    <span key={o} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                                {o}
                            </span>
                                                ))}
                                            </div>
                                        )}
                                        {typeof fld.max === "number" && fld.type === "rating" && (
                                            <p className="mt-2 text-sm text-gray-600">Max: {fld.max}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeField(fld.id)}
                                        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-sm text-red-600 hover:bg-red-50">
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                    {/* Preview column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Preview JSON</h3>
                                <button
                                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(form, null, 2))}
                                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100"
                                >Copy</button>
                            </div>
                            <pre className="max-h-[60vh] overflow-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm leading-6">
{JSON.stringify(form, null, 2)}
              </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function prettyType(t: FieldType) {
    switch (t) {
        case "text": return "Text";
        case "multiple_choice": return "Multiple choice";
        case "checkbox": return "Checkboxes";
        case "rating": return "Rating";
        default: return t;
    }
}


// export default function Page() {
//     return <FormBuilderUI/>;
// }


// Correct - update in frontend/app/builder/page.tsx
export default function Page({ initialForm, onSave, isEditMode }: FormBuilderProps) {
    return (
        <FormBuilderUI
            initialForm={initialForm}
            onSave={onSave}
            isEditMode={isEditMode}
        />
    );
}