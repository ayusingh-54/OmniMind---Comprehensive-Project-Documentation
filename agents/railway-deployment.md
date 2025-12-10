# Railway Deployment Guide

This guide explains how to deploy GradientFlow's RAG service and Agent service to Railway.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Deploy RAG Service](#deploy-rag-service)
- [Deploy Agent Service](#deploy-agent-service)
- [Configure Backend Connection](#configure-backend-connection)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account logged in
3. Backend service deployed and accessible

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login
```

---

## Architecture Overview

### Recommended Architecture: Internal Network within Same Project

Deploy all services in the **same Railway project** using internal network communication:

```
┌─────────────────────────────────────────────────────────────────┐
│  Railway Project                                                │
│                                                                 │
│  ┌─────────────────┐                                            │
│  │   Frontend      │  (Static files served by Backend)          │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐   Internal Network  ┌─────────────────┐    │
│  │  Backend API    │◄───────────────────▶│  Agent Service  │    │
│  │  (web)          │                     │  (agents)       │    │
│  │  :4000          │                     │                 │    │
│  └────────┬────────┘                     └─────────────────┘    │
│           │                                                     │
│           │ Internal Network                                    │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │  RAG Service    │                                            │
│  │  (rag)          │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

Internal URL format: http://<service-name>.railway.internal:<port>
```

| Service       | Description                   | Internal URL                          |
| ------------- | ----------------------------- | ------------------------------------- |
| Backend       | Express API + Static Frontend | `http://web.railway.internal:4000`    |
| Agent Service | Multi-Agent Management        | `http://agents.railway.internal:8080` |
| RAG Service   | ChromaDB Vector Search        | `http://rag.railway.internal:4001`    |

### Internal Network Benefits

- **Security**: Internal traffic not exposed to public internet
- **Low Latency**: No public network hops
- **Simplified Configuration**: No public CORS configuration needed

---

## Deploy RAG Service

RAG service provides document upload and semantic search functionality.

### 1. Initialize Project

```bash
cd agents/rag
railway init
# Select workspace
# Enter project name, e.g.: GradientFlow-RAG
```

### 2. Create Persistent Storage Volume

ChromaDB requires persistent storage for vector data:

```bash
# Link to service
railway link

# Add storage volume
railway volume add --mount-path /data

# Set environment variables
railway variables --set "CHROMA_DB_PATH=/data/chroma_db"
```

### 3. Deploy

```bash
railway up
```

### 4. Get Domain

```bash
railway domain
```

Example output: `https://gradientflow-rag-production.up.railway.app`

### 5. Verify Deployment

```bash
curl https://your-domain.up.railway.app/health
```

Expected response:

```json
{ "service": "rag", "status": "ok" }
```

### RAG Service API

| Endpoint      | Method | Description                                             |
| ------------- | ------ | ------------------------------------------------------- |
| `/health`     | GET    | Health check                                            |
| `/rag/search` | POST   | Semantic search `{"query": "...", "topK": 5}`           |
| `/rag/upload` | POST   | Upload document `{"content": "...", "filename": "..."}` |
| `/rag/stats`  | GET    | Knowledge base statistics                               |
| `/rag/delete` | POST   | Delete document `{"doc_hash": "..."}`                   |
| `/rag/clear`  | POST   | Clear knowledge base                                    |

---

## Deploy Agent Service

Agent service manages multiple AI agents running concurrently.

### 1. Initialize Project

```bash
cd agents
railway init
# Select workspace
# Enter project name, e.g.: GradientFlow-Agents
```

### 2. Set Environment Variables

**Using Internal Network (recommended)**: If backend service is in the same Railway project, use internal URL:

```bash
# Internal network URL (more secure, lower latency)
railway variables --set "API_BASE=http://web.railway.internal:4000"
railway variables --set "AGENT_API_TOKEN=your-agent-token"
railway variables --set "AGENT_LOGIN_EMAIL=root@example.com"
railway variables --set "AGENT_LOGIN_PASSWORD=your-password"
```

**Using Public URL**: If backend is on another platform:

```bash
railway variables --set "API_BASE=https://your-backend-url.com"
```

| Variable               | Description      | Internal Network Example           |
| ---------------------- | ---------------- | ---------------------------------- |
| `API_BASE`             | Backend API URL  | `http://web.railway.internal:4000` |
| `AGENT_API_TOKEN`      | Agent auth token | `your-secret-token`                |
| `AGENT_LOGIN_EMAIL`    | Login email      | `root@example.com`                 |
| `AGENT_LOGIN_PASSWORD` | Login password   | `your-password`                    |

> **Note**: Service name in internal URL (e.g., `web`) must match the service name in Railway Dashboard.

### 3. Deploy

```bash
railway up
```

### 4. Get Domain (Optional)

```bash
railway domain
```

### 5. Verify Deployment

```bash
curl https://your-domain.up.railway.app/health
```

Expected response:

```json
{
  "status": "running",
  "service": "agent-manager",
  "agents_running": 2,
  "api_base": "https://your-backend-url.com"
}
```

### Agent Service API

| Endpoint  | Method | Description                        |
| --------- | ------ | ---------------------------------- |
| `/health` | GET    | Health check (status, agent count) |
| `/status` | GET    | Detailed agent status              |

### Agent Service Features

- **Auto Start**: Automatically loads all active agents on startup
- **Hot Reload**: Syncs every 3 seconds, auto-starts new agents, stops deleted agents
- **Auto Restart**: Automatically restarts crashed agents
- **Heartbeat**: Periodically sends heartbeat to backend

---

## Configure Backend Connection

After deployment, update backend environment variables to connect to RAG service:

### Local Development

Create or edit `.env` file in project root:

```env
# RAG Service (Railway)
RAG_SERVICE_URL=https://your-rag-domain.up.railway.app

# Other configuration
PORT=4000
JWT_SECRET=your-jwt-secret
AGENT_API_TOKEN=your-agent-token
```

### Production Environment

Set environment variables in backend deployment platform:

```
RAG_SERVICE_URL=https://your-rag-domain.up.railway.app
```

---

## Common Commands

### View Logs

```bash
railway logs
```

### View Status

```bash
railway status
```

### Open Dashboard

```bash
railway open
```

### Redeploy

```bash
railway up
```

### View Environment Variables

```bash
railway variables
```

### Set Environment Variables

```bash
railway variables --set "KEY=value"
```

---

## Troubleshooting

### 1. RAG Service Returns "Knowledge base is empty"

Ensure storage volume is created and path is correct:

```bash
railway volume add --mount-path /data
railway variables --set "CHROMA_DB_PATH=/data/chroma_db"
railway up  # Redeploy
```

### 2. Agent Service Login Failed

Check environment variables:

```bash
railway variables
```

Ensure `API_BASE` is accessible, and `AGENT_LOGIN_EMAIL` and `AGENT_LOGIN_PASSWORD` are correct.

### 3. Agent Cannot Connect to Backend

1. Confirm backend URL is correct and publicly accessible
2. Confirm backend CORS configuration allows Railway domain
3. Check if `AGENT_API_TOKEN` matches backend configuration

### 4. Deployment Timeout

Railway free tier has resource limits. If deployment times out:

1. Check `healthcheckTimeout` in `railway.toml`
2. Ensure dependency installation won't timeout
3. Consider upgrading Railway plan

### 5. Storage Volume Data Lost

Ensure:

1. Storage volume is correctly mounted
2. Application uses `/data` path for data storage
3. Do not delete storage volume

---

## Environment Variables Reference

### RAG Service

| Variable         | Default           | Description           |
| ---------------- | ----------------- | --------------------- |
| `PORT`           | Railway assigned  | Service port          |
| `CHROMA_DB_PATH` | `/data/chroma_db` | ChromaDB storage path |

### Agent Service

| Variable               | Default                 | Description       |
| ---------------------- | ----------------------- | ----------------- |
| `PORT`                 | Railway assigned        | Health check port |
| `API_BASE`             | `http://localhost:4000` | Backend API URL   |
| `AGENT_API_TOKEN`      | `dev-agent-token`       | Agent auth token  |
| `AGENT_LOGIN_EMAIL`    | `root@example.com`      | Login email       |
| `AGENT_LOGIN_PASSWORD` | `1234567890`            | Login password    |

---

## File Structure

```
agents/
├── rag/                      # RAG service deployment directory
│   ├── railway.toml          # Railway configuration
│   ├── Procfile              # Process definition
│   ├── requirements.txt      # Python dependencies
│   └── rag_service.py        # RAG service code
│
├── railway.toml              # Agent service Railway configuration
├── Procfile                  # Agent service process definition
├── requirements.txt          # Agent service dependencies
├── agent_runner.py           # Agent service entry point (Railway)
├── multi_agent_manager.py    # Multi-agent manager
├── agent_service.py          # Agent implementation
└── core/                     # Core modules
    ├── config.py             # Configuration (supports environment variables)
    ├── api_client.py         # API client
    └── ...
```

---

## Update Deployment

When code is updated, redeploy:

```bash
# RAG service
cd agents/rag
railway up

# Agent service
cd agents
railway up
```

Or connect GitHub repository for automatic deployment.
