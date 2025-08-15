"use client";
import { useMemo, useState } from "react";


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

// ---------- UI ----------
function FormBuilderUI() {
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

    const saveDraft = async () => {
        try {
            const res = await fetch("/api/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setDraftId(data.id || data._id || null);
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
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-lg font-semibold shadow-sm outline-none focus:border-gray-400"
                            placeholder="Form title"
                        />
                        {draftId && (
                            <p className="mt-1 text-sm text-gray-500">Saved as ID: <span className="font-mono">{draftId}</span></p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={saveDraft} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-100">Save draft</button>
                        <button onClick={clearAll} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50">Clear</button>
                        <button onClick={saveDraft} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black">Publish</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Builder column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Field composer */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Add a question</p>

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


export default function Page() {
    return <FormBuilderUI/>;
}


// "use client";
//
// import { useEffect, useMemo, useState } from "react";
//
// // ---------- Types shared with backend ----------
// type FieldType = "text" | "multiple_choice" | "checkbox" | "rating";
//
// export type Field = {
//     id: string;                 // stable id per field
//     type: FieldType;
//     label: string;
//     required: boolean;
//     options?: string[];         // for MC/checkbox
//     max?: number;               // for rating, default 5
// };
//
// type FormPayload = {
//     title: string;
//     fields: Field[];
// };
//
// // ---------- Helpers ----------
// const uuid = () =>
//     (typeof crypto !== "undefined" && "randomUUID" in crypto
//         ? crypto.randomUUID()
//         : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
//
// const DRAFT_KEY = "formbuilder:draft";
//
// function blankField(t: FieldType): Field {
//     switch (t) {
//         case "text":
//             return { id: uuid(), type: "text", label: "Untitled question", required: false };
//         case "multiple_choice":
//             return {
//                 id: uuid(),
//                 type: "multiple_choice",
//                 label: "Choose one",
//                 required: false,
//                 options: ["Option A", "Option B"],
//             };
//         case "checkbox":
//             return {
//                 id: uuid(),
//                 type: "checkbox",
//                 label: "Select all that apply",
//                 required: false,
//                 options: ["Option A", "Option B"],
//             };
//         case "rating":
//             return { id: uuid(), type: "rating", label: "Rate it", required: false, max: 5 };
//     }
// }
//
// // Simple validation: collect problems per-field id and a top-level list
// function validateForm(form: FormPayload) {
//     const errors: Record<string, string[]> = {};
//     const add = (id: string, msg: string) => {
//         errors[id] ??= [];
//         errors[id].push(msg);
//     };
//
//     if (!form.title.trim()) add("_form", "Title is required");
//
//     for (const f of form.fields) {
//         if (!f.label.trim()) add(f.id, "Label is required");
//
//         if (f.type === "multiple_choice" || f.type === "checkbox") {
//             const opts = (f.options ?? []).map((s) => s.trim()).filter(Boolean);
//             if (opts.length === 0) add(f.id, "At least one option is required");
//         }
//
//         if (f.type === "rating") {
//             const m = f.max ?? 5;
//             if (m < 2 || m > 10) add(f.id, "Rating max must be between 2 and 10");
//         }
//     }
//
//     return errors;
// }
//
// export default function BuilderPage() {
//     const [title, setTitle] = useState("Untitled Form");
//     const [fields, setFields] = useState<Field[]>([]);
//     const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
//     const [message, setMessage] = useState<string | null>(null);
//
//     // Load draft once
//     useEffect(() => {
//         try {
//             const s = localStorage.getItem(DRAFT_KEY);
//             if (s) {
//                 const d = JSON.parse(s) as FormPayload;
//                 setTitle(d.title);
//                 setFields(d.fields);
//                 setMessage("Draft loaded");
//             } else {
//                 // Start with one text field to guide user
//                 setFields([blankField("text")]);
//             }
//         } catch {
//             /* ignore */
//         }
//     }, []);
//
//     const form: FormPayload = useMemo(() => ({ title, fields }), [title, fields]);
//
//     const errors = useMemo(() => validateForm(form), [form]);
//     const hasErrors = Object.keys(errors).length > 0;
//
//     function addField(t: FieldType) {
//         setFields((arr) => [...arr, blankField(t)]);
//     }
//
//     function updateField(id: string, patch: Partial<Field>) {
//         setFields((arr) => arr.map((f) => (f.id === id ? { ...f, ...patch } : f)));
//     }
//
//     function removeField(id: string) {
//         setFields((arr) => arr.filter((f) => f.id !== id));
//     }
//
//     // ---- Drag & drop reorder (HTML5, minimal) ----
//     const [dragIndex, setDragIndex] = useState<number | null>(null);
//
//     function onDragStart(idx: number) {
//         setDragIndex(idx);
//     }
//     function onDragOver(e: React.DragEvent) {
//         e.preventDefault();
//     }
//     function onDrop(idx: number) {
//         if (dragIndex === null || dragIndex === idx) return;
//         setFields((arr) => {
//             const copy = arr.slice();
//             const [moved] = copy.splice(dragIndex, 1);
//             copy.splice(idx, 0, moved);
//             return copy;
//         });
//         setDragIndex(null);
//     }
//
//     // ---- Drafts ----
//     function saveDraft() {
//         try {
//             localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
//             setSaving("draft");
//             setMessage("Draft saved locally");
//             setTimeout(() => setSaving("idle"), 600);
//         } catch (e) {
//             setMessage("Failed to save draft");
//         }
//     }
//     function clearDraft() {
//         localStorage.removeItem(DRAFT_KEY);
//         setMessage("Draft cleared");
//     }
//
//     // ---- Publish to backend ----
//     async function publish() {
//         setMessage(null);
//
//         if (hasErrors) {
//             setMessage("Fix validation issues before publishing.");
//             return;
//         }
//
//         try {
//             setSaving("publish");
//             const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
//             const res = await fetch(`${api}/api/forms`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(form),
//             });
//             if (!res.ok) {
//                 const txt = await res.text();
//                 throw new Error(txt || `HTTP ${res.status}`);
//             }
//             const created = await res.json();
//             setMessage(`Published ✓ (form id: ${created.id})`);
//             // keep a copy as last draft
//             localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
//         } catch (err: any) {
//             setMessage(`Publish failed: ${err.message ?? String(err)}`);
//         } finally {
//             setSaving("idle");
//         }
//     }
//
//     return (
//         <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
//             <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
//                 <input
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     placeholder="Form title"
//                     style={{
//                         flex: 1,
//                         fontSize: 20,
//                         padding: "8px 10px",
//                         borderRadius: 8,
//                         border: "1px solid #444",
//                         background: "#111",
//                         color: "white",
//                     }}
//                 />
//                 <button onClick={saveDraft} disabled={saving !== "idle"} title="Save draft to your browser">
//                     💾 Save draft
//                 </button>
//                 <button onClick={clearDraft} title="Delete local draft">🗑️ Clear</button>
//                 <button onClick={publish} disabled={saving !== "idle"} style={{ fontWeight: 600 }}>
//                     🚀 Publish
//                 </button>
//             </header>
//
//             {message && (
//                 <p style={{ marginBottom: 16, color: "#9be" }}>
//                     {message}
//                 </p>
//             )}
//
//             {"_form" in errors && (
//                 <p style={{ color: "#f88", marginBottom: 8 }}>{errors["_form"].join(", ")}</p>
//             )}
//
//             <section style={{ display: "grid", gap: 12 }}>
//                 {fields.map((f, idx) => {
//                     const fieldErrors = errors[f.id] ?? [];
//                     return (
//                         <article
//                             key={f.id}
//                             draggable
//                             onDragStart={() => onDragStart(idx)}
//                             onDragOver={onDragOver}
//                             onDrop={() => onDrop(idx)}
//                             style={{
//                                 border: "1px solid #333",
//                                 background: "#151515",
//                                 borderRadius: 10,
//                                 padding: 14,
//                             }}
//                         >
//                             <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
//                                 <span style={{ cursor: "grab" }}>⠿</span>
//                                 <select
//                                     value={f.type}
//                                     onChange={(e) => updateField(f.id, { type: e.target.value as FieldType })}
//                                 >
//                                     <option value="text">Text</option>
//                                     <option value="multiple_choice">Multiple choice</option>
//                                     <option value="checkbox">Checkboxes</option>
//                                     <option value="rating">Rating</option>
//                                 </select>
//
//                                 <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
//                                     <input
//                                         type="checkbox"
//                                         checked={f.required}
//                                         onChange={(e) => updateField(f.id, { required: e.target.checked })}
//                                     />
//                                     required
//                                 </label>
//
//                                 <button onClick={() => removeField(f.id)} title="Delete">🗑️</button>
//                             </div>
//
//                             <input
//                                 value={f.label}
//                                 onChange={(e) => updateField(f.id, { label: e.target.value })}
//                                 placeholder="Question label"
//                                 style={{
//                                     width: "100%",
//                                     padding: "8px 10px",
//                                     borderRadius: 8,
//                                     border: "1px solid #444",
//                                     background: "#0f0f0f",
//                                     color: "white",
//                                     marginBottom: 10,
//                                 }}
//                             />
//
//                             {(f.type === "multiple_choice" || f.type === "checkbox") && (
//                                 <OptionsEditor
//                                     value={f.options ?? []}
//                                     onChange={(options) => updateField(f.id, { options })}
//                                 />
//                             )}
//
//                             {f.type === "rating" && (
//                                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                                     <label>
//                                         Max stars:&nbsp;
//                                         <input
//                                             type="number"
//                                             min={2}
//                                             max={10}
//                                             value={f.max ?? 5}
//                                             onChange={(e) => updateField(f.id, { max: Number(e.target.value) })}
//                                             style={{ width: 80 }}
//                                         />
//                                     </label>
//                                 </div>
//                             )}
//
//                             {fieldErrors.length > 0 && (
//                                 <ul style={{ color: "#f88", marginTop: 8 }}>
//                                     {fieldErrors.map((er, i) => (
//                                         <li key={i}>• {er}</li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </article>
//                     );
//                 })}
//             </section>
//
//             <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
//                 <button onClick={() => addField("text")}>＋ Text</button>
//                 <button onClick={() => addField("multiple_choice")}>＋ Multiple choice</button>
//                 <button onClick={() => addField("checkbox")}>＋ Checkboxes</button>
//                 <button onClick={() => addField("rating")}>＋ Rating</button>
//             </div>
//
//             <details style={{ marginTop: 18 }}>
//                 <summary>Preview JSON</summary>
//                 <pre style={{ whiteSpace: "pre-wrap", background: "#0e0e0e", padding: 12, borderRadius: 8 }}>
// {JSON.stringify(form, null, 2)}
//         </pre>
//             </details>
//         </main>
//     );
// }
//
// // ---- Subcomponent: options editor for MC/checkbox ----
// function OptionsEditor({
//                            value,
//                            onChange,
//                        }: {
//     value: string[];
//     onChange: (next: string[]) => void;
// }) {
//     const [input, setInput] = useState("");
//
//     function add() {
//         const v = input.trim();
//         if (!v) return;
//         onChange([...value, v]);
//         setInput("");
//     }
//
//     function remove(idx: number) {
//         const copy = value.slice();
//         copy.splice(idx, 1);
//         onChange(copy);
//     }
//
//     function update(idx: number, v: string) {
//         const copy = value.slice();
//         copy[idx] = v;
//         onChange(copy);
//     }
//
//     return (
//         <div style={{ display: "grid", gap: 6 }}>
//             {value.map((opt, idx) => (
//                 <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                     <input
//                         value={opt}
//                         onChange={(e) => update(idx, e.target.value)}
//                         style={{ flex: 1, padding: "6px 8px" }}
//                     />
//                     <button onClick={() => remove(idx)} title="Remove">✖</button>
//                 </div>
//             ))}
//             <div style={{ display: "flex", gap: 8 }}>
//                 <input
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     placeholder="Add option"
//                     onKeyDown={(e) => e.key === "Enter" && add()}
//                     style={{ flex: 1, padding: "6px 8px" }}
//                 />
//                 <button onClick={add}>Add</button>
//             </div>
//         </div>
//     );
// }
