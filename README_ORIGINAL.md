# Active LLM Group Chat System

An intelligent group chat app built with a React + Vite frontend and an Express + lowdb backend. It supports user authentication, persistent messages, multi-agent collaboration, and integrates both RAG knowledge-base search and web search. The UI is inspired by Telegram/Discord and is great for prototypes, demos, and "LLM group chat" experiments.

> The project ships with a **Python agent service** (`agents/`) that can connect to real LLM backends. Messages, users, and typing states are stored in the local API database at `server/data.json`.

---

## Features

### Core

- **Auth**: Email register/login, JWT (httpOnly cookie + Bearer), DiceBear avatars
- **Messaging UX**: Markdown bubbles, reply preview, @mentions, emoji reactions, hover actions
- **Message status**: Sending, sent, delivered, read, failed
- **Date separators**: Automatic grouping by day
- **Real-time sync**: Typing indicators (`/typing`) and message polling (`/messages`)
- **Member list**: Channel placeholder + presence + BOT badge; collapsible on mobile
- **Persistence**: Users, messages, typing state saved in `server/data.json`

### Agent capabilities

- **Multiple agents**: Python agent service (`agents/`) runs many agents concurrently
- **Agent picker**: Dropdown with keyboard navigation
- **@mention detection**: Respond when mentioned
- **Heartbeat tracking**: Agent online status
- **Tool calls**: Context fetch, web search, knowledge-base search
- **Sequential tool calls**: Multi-round tool execution
- **Max rounds**: Configurable reply rounds per agent
- **Cascading deletes**: Remove agent replies when a user message is deleted
- **MCP integration**: FastMCP-based Model Context Protocol support

### Advanced

- **Chat info sidebar**: Shared content (docs/links/media), participant stats, task extraction
- **AI summaries**: One-click conversation summary (SSE streaming with reasoning trace)
- **RAG knowledge base**: ChromaDB vector search (`agents/rag_service.py`)
- **Web search**: DuckDuckGo integration (no API key needed)
- **Virtualized rendering**: `react-virtuoso` for large histories
- **Error boundaries**: Render protection
- **Network status**: Offline/online detection
- **LLM settings**: Configurable endpoint, model, API key

---

## Quick Start

### Requirements

- Node.js 18+ (18/20 recommended)
- npm or compatible package manager
- Python 3.8+ (for agent and RAG services)

### Full stack (4 terminals)

```bash
# Terminal 1: Backend API
npm install              # first run
npm run server           # http://localhost:4000

# Terminal 2: RAG service (recommended)
cd agents
pip install -r requirements-rag.txt
python rag_service.py --port 4001    # http://localhost:4001

# Terminal 3: Agent service
cd agents
pip install -r requirements.txt
python multi_agent_manager.py --email root@example.com --password 1234567890

# Terminal 4: Frontend dev server
npm run dev              # http://localhost:5173
```

**Startup order**: Backend → RAG service → Agent service → Frontend

### Minimal (frontend + backend only)

```bash
# Backend
npm run server

# Frontend
npm run dev
```

### Environment variables

| Variable          | Default                 | Description                               |
| ----------------- | ----------------------- | ----------------------------------------- |
| `VITE_API_URL`    | `http://localhost:4000` | Frontend API base URL                     |
| `PORT`            | `4000`                  | Backend API port                          |
| `CLIENT_ORIGIN`   | `http://localhost:5173` | CORS whitelist (comma-separated)          |
| `JWT_SECRET`      | —                       | JWT signing secret (change in production) |
| `DB_PATH`         | `server/data.json`      | Data store path                           |
| `AGENT_API_TOKEN` | —                       | Agent API auth token                      |
| `RAG_SERVICE_URL` | `http://localhost:4001` | RAG service URL                           |

### Suggested flow

1. Register or log in
2. Send messages (try **Markdown**)
3. Add reactions and quote replies
4. Mention `@GPT-4` or type `gpt` to trigger the bot
5. Resize the window to test the responsive sidebar

---

## Project Structure

```
groupchat/
├── src/                    # React frontend
│   ├── api/                # API client
│   ├── components/         # UI components
│   ├── context/            # ChatContext, TypingContext
│   ├── hooks/              # Custom hooks
│   └── types/              # TypeScript types
├── server/                 # Express backend
│   ├── server.js           # API server
│   ├── data.json           # Data store (users/messages/agents)
│   └── chroma_rag_db/      # ChromaDB vector database
└── agents/                 # Python agent services
    ├── base_agent.py       # Agent base class
    ├── agent_service.py    # Single-agent service
    ├── multi_agent_manager.py # Multi-agent manager
    ├── mcp_research_server.py # MCP research service (FastMCP)
    ├── tools.py            # Tool helpers
    ├── query.py            # LLM client (OpenAI/Azure/Anthropic)
    ├── core.py             # Core config/utilities
    ├── rag_service.py      # RAG vector search (ChromaDB + Flask)
    ├── requirements.txt    # Agent deps
    └── requirements-rag.txt # RAG deps
```

---

## API Overview

### Auth

- `POST /auth/register` – Register
- `POST /auth/login` – Log in
- `POST /auth/logout` – Log out
- `GET /auth/me` – Current user

### Messages

- `GET /messages` – List messages (supports paging and `since`)
- `POST /messages` – Send a message
- `POST /messages/summarize` – AI summary (SSE)
- `DELETE /messages/:id` – Delete a message (cascades replies)
- `POST /messages/:id/reactions` – Add/toggle reactions

### Users

- `GET /users` – List all users

### Agent config

- `GET /agents` – List agent configs
- `POST /agents/configs` – Create agent
- `PATCH /agents/configs/:id` – Update agent
- `DELETE /agents/configs/:id` – Delete agent

### Agent runtime

- `POST /agents/:id/messages` – Agent sends a message
- `POST /agents/:id/heartbeat` – Agent heartbeat
- `POST /agents/:id/tools/web-search` – Web search
- `POST /agents/:id/tools/local-rag` – Knowledge-base search

### Knowledge base

- `POST /knowledge-base/upload` – Upload a document
- `GET /knowledge-base/documents` – List documents
- `DELETE /knowledge-base/documents/:id` – Delete a document

---

## Tech Stack

### Frontend

- React 18 + TypeScript + Vite
- framer-motion, lucide-react, clsx
- react-virtuoso, react-markdown
- react-hot-toast, dayjs

### Backend

- Express + lowdb (JSON storage)
- bcryptjs, jsonwebtoken
- cookie-parser, cors

### Agent services

- Python + OpenAI SDK
- FastMCP (Model Context Protocol)
- ChromaDB + Flask (RAG)

---

## Data & Reset

- **Messages/users**: `server/data.json`
- **Knowledge base**: `server/chroma_rag_db/` (ChromaDB)
- **Reset**:
  - Messages/users: stop services → delete `server/data.json` → restart
  - Knowledge base: stop services → delete `server/chroma_rag_db/` → restart
- **Production tips**: Use a real database, rotate `JWT_SECRET`, add HTTPS, rate limiting, logging

---

## Test Account (dev only)

- Email: `root@example.com`
- Password: `1234567890`

---

## When to Use

- Need an out-of-the-box chat demo with login, persistence, and LLM bot
- Need a React + TS + Vite + Express + lowdb starter that can plug into real backends/models
- Interactive prototypes for product discussions or workshops

---

## Roadmap

- Replace polling with WebSocket/SSE
- Add multi-channel/DM (filter by `channelId`)
- Stream LLM responses
- Harden for production: HTTPS, secure cookies, rate limiting, input validation, logging/alerts

### Completed

- ✅ Multi-agent concurrency
- ✅ MCP (Model Context Protocol) integration
- ✅ Agent selector UI
- ✅ LLM settings UI
- ✅ Localization support
- ✅ Sequential tool calls
- ✅ Max rounds configuration
