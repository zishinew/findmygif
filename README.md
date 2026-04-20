# findmygif

upload a screenshot → ai figures out the vibe → get the perfect reaction gif.

## how it works

1. **upload** — drop a screenshot of any conversation
2. **ai analysis** — gemini vision reads the text, detects the tone
3. **gif search** — giphy returns matching reaction gifs
4. **download** — save the gif and use it anywhere
5. **trending** — popular picks for similar contexts surface automatically

## stack

| layer | tech |
|-------|------|
| frontend | next.js, react, typescript |
| backend | fastapi, python |
| ai | gemini vision api |
| gifs | giphy api |
| vectors | pinecone |

## setup

### 1. api keys

```bash
cd backend
cp .env.example .env
```

you need:
- **gemini api key** → [aistudio.google.com](https://aistudio.google.com/)
- **giphy api key** → [developers.giphy.com](https://developers.giphy.com/)
- **pinecone api key** → [pinecone.io](https://www.pinecone.io/)

### 2. backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

runs at `http://localhost:8000`

### 3. frontend

```bash
cd frontend
npm install
npm run dev
```

runs at `http://localhost:3000`

## deployment

### backend (render / railway)

- set the root directory to `backend/`
- start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- add all env vars from `.env.example`

### frontend (vercel)

- set the root directory to `frontend/`
- add env var: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
- framework: next.js (auto-detected)
