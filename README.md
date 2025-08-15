# dune
dune interview 


want to run it next? here’s the quickest path (no Docker):

One command (if you grabbed the no-Docker zip)

From the project root:

./run_local.sh


That starts the Go API (8080) and Next.js (3000).

Manual start

Terminal tab 1:

cd backend
cp .env.example .env
go mod download
go run main.go
# health check: http://localhost:8080/healthz


Terminal tab 2:

cd frontend
cp .env.example .env.local
npm install
npm run dev
# app: http://localhost:3000

(Optional) tidy .gitignore

If you’re committing this repo, add:

# IDE & OS
.idea/
.DS_Store

# Node/Next
frontend/node_modules/
frontend/.next/
frontend/.env.local

# Go
backend/.env

# Archives
*.zip