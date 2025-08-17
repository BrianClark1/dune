import { FormModel, Field } from "../../builder/page";

const demoForm = {
    title: "Product Feedback Survey",
    fields: [
        {
            id: "name",
            type: "text",
            label: "What's your name?",
            required: true
        },
        {
            id: "satisfaction",
            type: "rating",
            label: "How satisfied are you with our product?",
            required: true,
            max: 5
        },
        {
            id: "frequency",
            type: "multiple_choice",
            label: "How often do you use our product?",
            required: true,
            options: [
                "Daily",
                "Weekly",
                "Monthly",
                "Rarely",
                "Never"
            ]
        },
        {
            id: "features",
            type: "checkbox",
            label: "Which features do you use?",
            required: true,
            options: [
                "Dashboard",
                "Reports",
                "API Integration",
                "Mobile App",
                "Analytics"
            ]
        }
    ]
};

const names = ["John", "Emma", "Michael", "Sophia", "William", "Olivia", "James", "Ava", "Alexander", "Isabella"];

function generateResponse(form: FormModel) {
    const response: Record<string, any> = {};

    form.fields.forEach(field => {
        switch (field.type) {
            case "text":
                response[field.id] = names[Math.floor(Math.random() * names.length)];
                break;
            case "rating":
                response[field.id] = Math.floor(Math.random() * field.max!) + 1;
                break;
            case "multiple_choice":
                response[field.id] = field.options![Math.floor(Math.random() * field.options!.length)];
                break;
            case "checkbox":
                const numSelections = Math.floor(Math.random() * field.options!.length) + 1;
                const shuffled = [...field.options!].sort(() => 0.5 - Math.random());
                response[field.id] = shuffled.slice(0, numSelections);
                break;
        }
    });

    return response;
}

export async function GET() {
    try {
        // Create form
        const formRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(demoForm)
        });

        if (!formRes.ok) throw new Error('Failed to create form');
        const form = await formRes.json();

        // Generate responses
        const responses = Array.from({ length: 100 }, () => generateResponse(form));

        // Submit responses
        for (const response of responses) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${form.id}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
            });
        }

        return Response.json({
            success: true,
            message: "Created form and 100 responses",
            formId: form.id
        });

    } catch (error) {
        console.error('Seeding error:', error);
        return Response.json({
            success: false,
            error: 'Failed to seed data'
        }, { status: 500 });
    }
}