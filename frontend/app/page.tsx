export default function Home() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900">Form Builder</h1>
                    <p className="text-gray-600">Create, manage, and analyze forms with ease</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <a href="/forms"
                       className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all">
                        <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v10a2 2 0 01-2 2z"/>
                        </svg>
                        <h2 className="text-xl font-semibold">View Forms</h2>
                        <p className="mt-2 text-sm text-gray-600 text-center">Browse published forms</p>
                    </a>

                    <a
                        href="/builder"
                        className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                    >
                        <svg className="w-8 h-8 text-green-500 mb-3" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                        <h2 className="text-xl font-semibold">Create Form</h2>
                        <p className="mt-2 text-sm text-gray-600 text-center">Build a new form</p>
                    </a>

                    <a
                        href="/dashboard"
                        className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                    >
                        <svg className="w-8 h-8 text-purple-500 mb-3" fill="none" stroke="currentColor"
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <h2 className="text-xl font-semibold">Dashboard</h2>
                        <p className="mt-2 text-sm text-gray-600 text-center">View analytics</p>
                    </a>
                </div>
            </div>
        </main>
    );
}