# Form Builder

A full-stack form builder application with real-time analytics built using Next.js, Go (Fiber), and MongoDB.

## Features

- Create and manage forms with multiple question types
- Drag-and-drop form builder interface
- Real-time analytics with SSE (Server-Sent Events)
- Support for text, multiple choice, checkbox, and rating questions
- Form response collection and visualization

## Setup

### Prerequisites

- Node.js 18+
- Go 1.19+
- MongoDB (local or Atlas)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
npm run dev`

```
### Backend
```bash
cd backend
# .env (create this file)
# MONGO_URI: Atlas or local, MONGO_DB: database name
cat > .env << 'EOF'
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=dune
MONGO_DB=dune
PORT=8080
ORIGIN=http://localhost:3000
EOF

go mod tidy
go run .
# -> Listening on :8080
```


### Challenges
- Setting up the local development environment and IDE configuration required significant initial effort
- Future improvements could include:
   - Implementing Redux for state management
   - Restructuring files for better organization and maintainability

### Testing
There are two ways to test form analytics:

1. Manual Testing
   - Create a form
   - Submit responses through the form interface
   - Watch the analytics dashboard update in real-time

2. Automated Testing
   - Create a form
   - Navigate to the dashboard
   - Use the "Test Response" button to generate random submissions
   - Observe automatic dashboard updates