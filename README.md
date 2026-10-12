# Universal Voice AI Platform | Powered by OpenRouter

## 1. Project Overview

A domain-agnostic, full-stack Voice AI Assistant platform that enables natural, real-time voice and text conversations with configurable AI personas. The application dynamically routes LLM intelligence through OpenRouter, supports domain-specific knowledge grounding (RAG), and executes agent tools with instant voice interruption.

---

## 2. AI Models and Tools Used

| Tool / Technology | Component / Provider | Purpose & Details |
| :--- | :--- | :--- |
| **Default AI Model** | `openrouter/auto` (OpenRouter) | Default configurable LLM. Dynamically selects and routes queries to optimal models (e.g., OpenAI GPT-4o, Meta LLaMA 3.3, Google Gemini) based on prompt complexity and provider availability. |
| **Fallback AI Model** | `meta-llama/llama-3.3-70b-instruct` (Meta / OpenRouter) | Secondary model invoked automatically if the primary provider experiences upstream 5xx outages or rate limits. Configurable via `OPENROUTER_FALLBACK_MODEL`. |
| **AI Gateway & API** | OpenRouter API (`https://openrouter.ai/api/v1`) | Unified OpenAI-compatible API gateway used for model orchestration, chat completions (`/chat/completions`), and tool calling across multiple LLM providers without hardcoded model APIs. |
| **Speech-to-Text (STT)** | Web Speech API (`SpeechRecognition`) | Client-side, browser-native speech recognition that captures microphone input and streams interim and final transcripts in real time. Pluggable backend `STTFactory` interface supports server providers. |
| **Text-to-Speech (TTS)** | Web Speech API (`SpeechSynthesis`) | Client-side, browser-native speech synthesis that reads assistant responses aloud. Supports domain-specific voice tuning and instant interruption upon user input. |
| **RAG & Knowledge Retrieval** | In-Memory Semantic Chunk Store (`RAGService`) | Chunks uploaded domain documents and performs semantic keyword retrieval to ground agent responses with verified facts. Configurable for PostgreSQL with `pgvector`. |
| **Agent Tool Execution** | OpenRouter Function Calling Protocol | Enables the active agent to call structured tools dynamically during inference, including built-in `calculator` (math evaluation) and `weather` (location condition lookup). |

*Note: OpenRouter acts as the API gateway, not the underlying model. Any supported OpenRouter model identifier can be set in `backend/.env` (e.g., `meta-llama/llama-3.3-70b-instruct`, `google/gemini-2.0-flash-001`, `anthropic/claude-3.5-sonnet`).*

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend:** Node.js, TypeScript, Fastify, Zod (schema validation), Dotenv
- **AI & Voice Layer:** OpenRouter API Gateway, Web Speech API (SpeechRecognition & SpeechSynthesis)
- **Data & Grounding:** In-Memory Vector Store / Document Chunker (with optional PostgreSQL + pgvector support)

---

## 4. How It Works

1. **Voice or Text Input:** The user speaks into the microphone (transcribed in real time via the Web Speech API) or types a message in the composer.
2. **Context & Tool Grounding:** The backend retrieves relevant domain knowledge chunks via the RAG service, injects the selected agent persona instructions, and binds enabled domain tools.
3. **Model Inference:** The request is dispatched to OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) using the configured model (default: `openrouter/auto`). Tool calls are executed on the backend if requested by the model.
4. **Response & Speech Output:** The generated response is rendered in the conversation transcript and vocalized through `window.speechSynthesis`, allowing instant interruption whenever the user speaks again.

---

## 5. Setup

### Prerequisites
- Node.js (v18+)
- An OpenRouter API Key (obtain from [openrouter.ai/keys](https://openrouter.ai/keys))

### Environment Variables
Configure `backend/.env` (copy from `backend/.env.example`):

```env
PORT=4000
HOST=0.0.0.0
APP_URL=http://localhost:3000

# OpenRouter Configuration
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct
```

### Installation & Run

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:4000`.*

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:3000`.*

3. Open `http://localhost:3000` in your browser.
