// app/layout.tsx
import type { Metadata } from "next";
import "./global.css"; // <- this must match the file name

export const metadata: Metadata = {
    title: "Form Builder",
    description: "Demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="bg-gray-50 text-gray-900">{children}</body>
        </html>
    );
}
