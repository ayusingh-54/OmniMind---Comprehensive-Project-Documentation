# Agent Service

Python-based multi-agent service that connects to the chat backend and intelligently responds to @ mentions with context awareness.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Agent Service](#agent-service)
- [GPT-OSS Harmony Format](#gpt-oss-harmony-format)
- [RAG Service](#rag-service)
- [MCP Research Server](#mcp-research-server)
- [Configuration Reference](#configuration-reference)
- [API Reference](#api-reference)
- [Extension Development](#extension-development)

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Ensure backend is running (in project root)
npm run server

# 3. Start multi-agent manager
python multi_agent_manager.py --email root@example.com --password 1234567890
```

---

## Architecture

```
                      Poll Messages
                  ←─────────────────────
  Chat Backend                           Multi-Agent Manager
  (Express.js)   ─────────────────────→    (Python)
  localhost:4000      Send Reply              │
       ↑                                      ├── Agent 1 Thread
       │                                      ├── Agent 2 Thread
       │    Get agent config                  └── Agent N Thread
       └────────────────────────────────────────→│
                                                 ↓
                                             LLM Backend
                                          (gpt-oss/openai/custom)
```

### Modular Architecture

```
agents/
├── core/                          # Core modules
│   ├── __init__.py               # Export all public interfaces
│   ├── config.py                 # Unified configuration constants
│   ├── response_cleaner.py       # Response cleanup + regex patterns
│   ├── api_client.py             # HTTP API wrapper (AgentAPIClient)
│   ├── mention_detector.py       # @ mention detection (MentionDetector)
│   ├── harmony_parser.py         # GPT-OSS Harmony format parser/builder
│   ├── tool_definitions.py       # Unified tool definitions (single source of truth)
│   ├── tool_formatters.py        # Tool formatters (Harmony/Text)
│   ├── llm_client.py             # LLM client (OpenAI SDK wrapper)
│   └── tool_executor.py          # Tool executor (AgentTools)
│
├── base_agent.py                  # Agent base class (BaseAgentService)
├── agent_service.py               # Agent service implementation (Harmony support)
├── multi_agent_manager.py         # Multi-agent manager
│
├── rag_service.py                 # RAG service
└── mcp_research_server.py         # MCP research server
```

---

## File Structure

### Core Modules (core/)

| File                       | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `core/config.py`           | Unified configuration constants (API_BASE, AGENT_TOKEN, etc.) |
| `core/response_cleaner.py` | LLM response cleanup, regex patterns                          |
| `core/api_client.py`       | HTTP API wrapper class (AgentAPIClient)                       |
| `core/mention_detector.py` | @ mention detection logic (MentionDetector)                   |
| `core/harmony_parser.py`   | GPT-OSS Harmony format parser and prompt builder              |
| `core/tool_definitions.py` | Unified tool definitions (single source of truth)             |
| `core/tool_formatters.py`  | Tool formatters (Harmony/Text format conversion)              |
| `core/llm_client.py`       | LLM client (OpenAI SDK wrapper)                               |
| `core/tool_executor.py`    | Tool executor (AgentTools class)                              |

### Service Files

| File                     | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `base_agent.py`          | Agent service abstract base class with shared logic    |
| `agent_service.py`       | Agent service implementation (Harmony format support)  |
| `multi_agent_manager.py` | Multi-agent manager                                    |
| `rag_service.py`         | RAG service - ChromaDB-based document vector retrieval |
| `mcp_research_server.py` | MCP research server - Academic paper search (FastMCP)  |

### Dependency Files

| File                   | Description                                   |
| ---------------------- | --------------------------------------------- |
| `requirements.txt`     | Base dependencies                             |
| `requirements-rag.txt` | RAG service dependencies (chromadb, flask)    |
| `requirements-mcp.txt` | MCP server dependencies (fastmcp, feedparser) |

### Documentation

| File                          | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `GPT_OSS_FUNCTION_CALLING.md` | GPT-OSS model Function Calling prompt building guide |

---

## Installation

```bash
# Base dependencies (required)
pip install -r requirements.txt

# RAG service dependencies (optional)
pip install -r requirements-rag.txt

# MCP server dependencies (optional)
pip install -r requirements-mcp.txt
```

---

## Agent Service

The agent service is responsible for listening to chat messages and responding intelligently.

### Startup Methods

```bash
# Single agent
python agent_service.py --agent-id helper-agent-1

# Multi-agent (recommended)
python multi_agent_manager.py --email root@example.com --password 1234567890

# Specify specific agents
python multi_agent_manager.py --agent-ids agent-1 agent-2
```

### Workflow

1. Login to backend to obtain JWT token
2. Fetch agent configuration (system prompt, model, etc.)
3. Periodically send heartbeat signals
4. Poll for new messages, detect @ mentions
5. Build context, call LLM to generate reply
6. Execute tool calls (reactions, search, etc.)
7. Send reply message

### Agent Modes

| Mode                       | Description                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| **Passive mode** (default) | Responds only when @ mentioned                                        |
| **Active mode**            | Automatically participates in conversations, can use `[SKIP]` to skip |

Active mode is enabled via `capabilities.answer_active: true`.

### Built-in Tools

| Tool                 | Format                 | Description                                  |
| -------------------- | ---------------------- | -------------------------------------------- |
| Emoji reaction       | `[REACT:👍:msg-id]`    | Add emoji to message                         |
| Context retrieval    | `[GET_CONTEXT:msg-id]` | Get 10 messages around the specified message |
| Full history         | `[GET_LONG_CONTEXT]`   | Get up to 50 historical messages             |
| Web search           | `[WEB_SEARCH:keyword]` | DuckDuckGo search                            |
| Knowledge base query | `[LOCAL_RAG:query]`    | Search local RAG knowledge base              |

---

## GPT-OSS Harmony Format

When using the `parallax` provider (self-hosted gpt-oss model), the Agent service automatically enables Harmony format for Function Calling.

### Auto Detection

```python
# Auto-detected in agent_service.py
if provider == "parallax":
    self._use_harmony_format = True
    print("[Agent] Harmony format enabled for GPT-OSS")
```

### Harmony Format Features

- **Special tokens**: `<|channel|>`, `<|message|>`, `<|call|>`, `<|return|>`, `<|end|>`
- **Channel types**: `analysis` (thinking), `commentary` (tool calls), `final` (final reply)
- **Tool definitions**: TypeScript namespace style

### Generated System Prompt Format

```
You are ChatGPT, a large language model trained by OpenAI.
Knowledge cutoff: 2024-06
Current date: 2025-01-15

Reasoning: low

# Valid channels: analysis, commentary, final. Channel must be included for every message.
Calls to these tools must go to the commentary channel: 'functions'.

# Instructions
{Your system prompt}

# Tools
## functions

namespace functions {

// Search the web for current information
type web_search = (_: {
// Search query
query: string,
}) => any;

// [MCP] Search for academic papers
type mcp_search_papers = (_: {
// Search query
query: string,
// Maximum results
limit?: number,
}) => any;

} // namespace functions
```

### Model Output Format

```
<|channel|>analysis<|message|>User is asking about weather, I need to call the search tool<|end|>
<|channel|>commentary to=functions.web_search <|constrain|>json<|message|>{"query":"Beijing weather"}<|call|>
```

### MCP Tool Integration

MCP tools are automatically added to Harmony format:

- Tool names get `mcp_` prefix (e.g., `mcp_search_papers`)
- Descriptions get `[MCP]` tag
- Parameters are automatically converted to Harmony format

See `GPT_OSS_FUNCTION_CALLING.md` for detailed documentation.

---

## RAG Service

ChromaDB-based document vector retrieval service that provides knowledge base capabilities for agents.

### Startup

```bash
pip install -r requirements-rag.txt
python rag_service.py --port 4001
```

### API

| Endpoint      | Method | Description               |
| ------------- | ------ | ------------------------- |
| `/rag/upload` | POST   | Upload document           |
| `/rag/search` | POST   | Semantic search           |
| `/rag/stats`  | GET    | Knowledge base statistics |
| `/rag/delete` | POST   | Delete document           |
| `/rag/clear`  | POST   | Clear knowledge base      |
| `/health`     | GET    | Health check              |

### Example

```python
import requests

# Upload document
requests.post("http://localhost:4001/rag/upload", json={
    "content": "Document content...",
    "filename": "doc.txt"
})

# Search
requests.post("http://localhost:4001/rag/search", json={
    "query": "search keywords",
    "topK": 5
})
```

---

## MCP Research Server

FastMCP-based academic paper search service supporting Semantic Scholar and arXiv.

### Startup

```bash
pip install -r requirements-mcp.txt

# SSE mode (HTTP access)
python mcp_research_server.py --transport sse --port 3001

# With authentication
python mcp_research_server.py --transport sse --port 3001 --auth

# stdio mode (Claude Desktop)
python mcp_research_server.py --transport stdio
```

### API Key Management

```bash
# Generate keys
python mcp_research_server.py --generate-keys 3

# List keys
python mcp_research_server.py --list-keys
```

### Available Tools

| Tool                  | Description                            |
| --------------------- | -------------------------------------- |
| `search_papers`       | Semantic Scholar paper search          |
| `search_arxiv`        | arXiv preprint search                  |
| `get_paper_details`   | Paper details (supports arXiv ID, DOI) |
| `find_similar_papers` | Similar paper recommendations          |
| `get_citations`       | Get papers citing this paper           |
| `get_references`      | Get references                         |
| `search_author`       | Author search                          |
| `fetch_webpage`       | Web page content fetching              |
| `format_citation`     | Citation formatting (APA/MLA/BibTeX)   |

### REST API

| Endpoint         | Method | Description  |
| ---------------- | ------ | ------------ |
| `/tools/list`    | GET    | List tools   |
| `/tools/execute` | POST   | Execute tool |
| `/health`        | GET    | Health check |

### Example

```python
import requests

# Search papers
resp = requests.post("http://localhost:3001/tools/execute", json={
    "tool": "search_papers",
    "arguments": {"query": "transformer attention", "limit": 5}
})

# Get paper details
resp = requests.post("http://localhost:3001/tools/execute", json={
    "tool": "get_paper_details",
    "arguments": {"paper_id": "2103.14030"}
})
```

---

## Configuration Reference

### Environment Variables

| Variable             | Default                 | Description                  |
| -------------------- | ----------------------- | ---------------------------- |
| `API_BASE`           | `http://localhost:4000` | Backend address              |
| `AGENT_TOKEN`        | `dev-agent-token`       | Agent API token              |
| `AGENT_ID`           | `helper-agent-1`        | Agent ID                     |
| `POLL_INTERVAL`      | `1`                     | Poll interval (seconds)      |
| `HEARTBEAT_INTERVAL` | `5`                     | Heartbeat interval (seconds) |

### Frontend Configuration

Set in the Web UI Agent Configuration Center:

| Setting         | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| System Prompt   | LLM system prompt                                                  |
| Provider        | `parallax` / `openai` / `azure` / `anthropic`                      |
| Model Name      | Model identifier                                                   |
| Temperature     | Response randomness (0.0-2.0)                                      |
| Max Tokens      | Maximum response length                                            |
| Endpoint        | LLM API endpoint (parallax mode)                                   |
| Reasoning Level | GPT-OSS reasoning depth: `low` / `medium` / `high` (parallax only) |

#### Reasoning Level Description

When using the `parallax` provider, you can configure Reasoning Level to control model thinking depth:

| Level    | Description                                   |
| -------- | --------------------------------------------- |
| `low`    | Fast response, suitable for simple Q&A        |
| `medium` | Balanced mode, suitable for general tasks     |
| `high`   | Deep thinking, suitable for complex reasoning |

### Agent Capabilities

| Capability       | Description                              |
| ---------------- | ---------------------------------------- |
| `answer_passive` | Respond when @ mentioned                 |
| `answer_active`  | Proactively participate in conversations |
| `like`           | Emoji reactions                          |
| `summarize`      | Conversation summarization               |

---

## API Reference

Backend endpoints used by the Agent service:

| Endpoint                       | Method | Description          |
| ------------------------------ | ------ | -------------------- |
| `/auth/login`                  | POST   | Login                |
| `/agents`                      | GET    | Get configuration    |
| `/agents/:id/heartbeat`        | POST   | Heartbeat            |
| `/agents/:id/messages`         | POST   | Send message         |
| `/agents/:id/reactions`        | POST   | Add reaction         |
| `/agents/:id/looking`          | POST   | View status          |
| `/agents/:id/context`          | GET    | Get context          |
| `/agents/:id/long-context`     | GET    | Get full history     |
| `/agents/:id/tools/web-search` | POST   | Web search           |
| `/agents/:id/tools/local-rag`  | POST   | Knowledge base query |
| `/messages`                    | GET    | Get messages         |

---

## Extension Development

### Creating Custom Agents

Inherit from `BaseAgentService` and implement abstract methods:

```python
from base_agent import BaseAgentService

class MyCustomAgent(BaseAgentService):
    def _init_llm(self, config):
        # Initialize LLM client
        pass

    def build_system_prompt(self, mode, users):
        # Build system prompt
        base = self._build_base_system_prompt(mode, users)
        return base + "\nYou are a professional assistant..."

    def generate_reply(self, context, current_msg, mode, users):
        # Generate reply
        # Return (only_tools: bool, response_text: str)
        return False, "Hello!"
```

### Modifying Configuration Constants

```python
# Modify in core/config.py
CONTEXT_LIMIT = 20  # Default 10
POLL_INTERVAL = 2   # Default 1
```

### Custom LLM

```python
from core import configure_llm, chat_with_history

configure_llm(base_url="https://your-endpoint/v1", api_key="your-key")
response = chat_with_history(messages, model="your-model")
```

### Adding Custom Tools

Tools use a unified definition architecture, add in `core/tool_definitions.py`:

```python
# core/tool_definitions.py

TOOL_DEFINITIONS = {
    # ... existing tools ...

    "my_custom_tool": {
        "name": "my_custom_tool",
        "description": "Custom tool description",
        "parameters": {
            "query": {
                "type": "string",
                "description": "Query parameter",
            }
        },
        "enabled_key": "tools.my_custom_tool",  # Corresponds to tools list in config
        "category": "custom",
        "text_format": "[MY_TOOL:query]",       # Text format
        "text_example": "[MY_TOOL:example query]",
        "usage_hint": "Usage scenario description",
    },
}
```

Formatters handle automatically:

- **Harmony format**: Added via `add_tools_to_harmony_builder()`
- **Text format**: Generated via `build_tools_text_prompt()`

### Unified Tool Definition Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    tool_definitions.py                       │
│                   (Single Source of Truth)                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  TOOL_DEFINITIONS = {                                │    │
│  │    "web_search": { name, desc, params, ... },       │    │
│  │    "local_rag": { name, desc, params, ... },        │    │
│  │    "react": { name, desc, params, ... },            │    │
│  │  }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   tool_formatters.py  │       │   tool_formatters.py  │
│  (Harmony Format)     │       │  (Text Format)        │
│                       │       │                       │
│ add_tools_to_harmony_ │       │ build_tools_text_     │
│ builder()             │       │ prompt()              │
│                       │       │                       │
│ Output: TypeScript    │       │ Output: [TOOL:args]   │
│ namespace style       │       │ documentation style   │
└───────────────────────┘       └───────────────────────┘
```

Benefits:

- **Single source of truth**: Tool definitions only need to be maintained in one place
- **Auto format conversion**: Harmony and Text formats use the same definitions
- **Easy to extend**: Adding new tools only requires updating `TOOL_DEFINITIONS`

### Parallax Provider

OpenAI-compatible custom endpoint:

1. Select `parallax` as Provider
2. Set Endpoint URL
3. Model defaults to `default`
4. API Key optional

---

## Log Examples

```
[Agent] Starting service...
[Agent] API: http://localhost:4000
[Agent] Agent ID: helper-agent-1
----------------------------------------
[Agent] Received @ message: who are you...
[Agent] ===== Prompt sent to model =====
[0] system: You are a helpful AI assistant...
[1] user: <Alice> [TO: YOU]: who are you
[Agent] ===== End of prompt =====
[Agent] Message sent: Hi! I'm your friendly AI assistant.
```
