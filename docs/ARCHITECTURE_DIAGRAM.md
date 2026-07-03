# 🏗️ Architecture Diagram: Copilot Auto-Generation

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │        /ideas Page (React Component)                           │    │
│  │  ┌───────────────────────────────────────────────────────────┐ │    │
│  │  │  Form:                                                    │ │    │
│  │  │  - Topic Input                                            │ │    │
│  │  │  - Idea Count Input (1-50)                                │ │    │
│  │  │  - [✨ Generate Ideas] Button                             │ │    │
│  │  │  - Loading State                                          │ │    │
│  │  │  - Error Messages                                         │ │    │
│  │  └───────────────────────────────────────────────────────────┘ │    │
│  │                            │                                    │    │
│  │                            ↓ onClick handler                    │    │
│  │  ┌───────────────────────────────────────────────────────────┐ │    │
│  │  │  handleGenerateIdeas()                                    │ │    │
│  │  │  - Validate topic not empty                               │ │    │
│  │  │  - POST to /api/ai/agent                                  │ │    │
│  │  │  - Show loading state                                     │ │    │
│  │  │  - Handle errors                                          │ │    │
│  │  │  - Populate textarea with JSON                            │ │    │
│  │  └───────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP POST
                                 │ {action: 'generateIdeas', topic: '...', count: 10}
                                 ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Backend)                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  /api/ai/agent (pages/api/ai/agent.ts)                          │   │
│  │  - Route handler                                                 │   │
│  │  - Validate request parameters                                  │   │
│  │  - Switch on action type                                        │   │
│  │  - Call getAgentProvider()                                      │   │
│  │  - Return JSON response                                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  getAgentProvider() → AgentProvider                             │   │
│  │  (lib/ai/agentProvider.ts)                                      │   │
│  │                                                                  │   │
│  │  generateIdeas(topic, count, context)                           │   │
│  │  - Build prompt with instructions                               │   │
│  │  - Call baseProvider.generate(prompt, context)                  │   │
│  │  - Parse JSON from response                                     │   │
│  │  - Validate array structure                                     │   │
│  │  - Return ideas array                                           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  getAIProvider() → GitHubModelsProvider                          │   │
│  │  (lib/ai/providerFactory.ts & lib/ai/githubProvider.ts)         │   │
│  │                                                                  │   │
│  │  generate(prompt, context)                                      │   │
│  │  - Build full prompt with context                               │   │
│  │  - Escape special characters                                    │   │
│  │  - Try candidates in order:                                     │   │
│  │    1. process.env.COPILOT_CLI_BIN                               │   │
│  │    2. 'copilot' command                                         │   │
│  │    3. 'npx @githubnext/copilot-cli'                            │   │
│  │  - Execute: exec(`${cmd} "${prompt}"`)                          │   │
│  │  - Return stdout as string                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  │ Child process exec
                                  │ "copilot \"prompt here\""
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      COPILOT CLI (Container)                            │
├──────────────────────────────────────────────────────────────────────────┤
│  /usr/local/bin/copilot                                                  │
│  - Symlink to copilot binary                                             │
│  - Downloaded by copilot_boot service                                    │
│  - Authenticates with GitHub                                            │
│  - Sends prompt to Copilot backend                                       │
│  - Returns JSON-formatted response                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS to GitHub
                                  │ Authenticate with stored credentials
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    GITHUB COPILOT BACKEND                               │
├──────────────────────────────────────────────────────────────────────────┤
│  - Process prompt                                                        │
│  - Generate ideas using AI model                                         │
│  - Format as JSON                                                        │
│  - Return to CLI                                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ JSON response
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      COPILOT CLI OUTPUT                                  │
│  ```json                                                                 │
│  [                                                                       │
│    {                                                                     │
│      "title": "Implementing GitOps with ArgoCD",                         │
│      "why_it_matters": "GitOps enables declarative...",                  │
│      "virality_score": 8,                                                │
│      "business_score": 9                                                 │
│    },                                                                    │
│    ...                                                                   │
│  ]                                                                       │
│  ```                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ stdout
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                 NEXT.JS SERVER (continued)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AgentProvider.generateIdeas() (continued)                      │   │
│  │  - Extract JSON from response                                   │   │
│  │  - Parse with JSON.parse()                                      │   │
│  │  - Validate is array                                            │   │
│  │  - Return: Promise<any[]>                                       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                        │
│                                 ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  /api/ai/agent response (continued)                             │   │
│  │  Return: {                                                       │   │
│  │    success: true,                                                │   │
│  │    data: [ideas...]                                              │   │
│  │  }                                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ JSON response
                                  ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (continued)                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  handleGenerateIdeas() (continued)                             │    │
│  │  - Parse response JSON                                          │    │
│  │  - Check json.success && json.data                              │    │
│  │  - setText(JSON.stringify(json.data, null, 2))                  │    │
│  │  - setMessage("✓ Generated X ideas!...")                        │    │
│  │  - setGenerateLoading(false)                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Textarea shows formatted JSON                                 │    │
│  │  Message shows: "✓ Generated 10 ideas!..."                     │    │
│  │  Button "Import Ideas" is now enabled                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  User clicks: "Import Ideas"                                           │
│                        ↓                                                │
│  handleSubmit() → /api/ideas (POST)                                    │
│                        ↓                                                │
│  Ideas saved to Supabase or localStorage                               │
│                        ↓                                                │
│  Ideas appear in table below                                           │
│                        ↓                                                │
│  User clicks: "Take Further"                                           │
│                        ↓                                                │
│  Navigate to: /ideas/research                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Enters topic & count
       │ 2. Clicks Generate button
       ↓
┌─────────────────────────────┐
│   Frontend (React)          │
│   app/ideas/page.tsx        │
└──────┬──────────────────────┘
       │
       │ 3. POST /api/ai/agent
       │ {action, topic, count}
       ↓
┌─────────────────────────────┐
│   Next.js API Route         │
│   /api/ai/agent.ts          │
└──────┬──────────────────────┘
       │
       │ 4. getAgentProvider()
       ↓
┌─────────────────────────────┐
│   AgentProvider             │
│   agentProvider.ts          │
└──────┬──────────────────────┘
       │
       │ 5. generateIdeas()
       │ Build prompt
       ↓
┌─────────────────────────────┐
│   AIProvider (GitHub)       │
│   githubProvider.ts         │
└──────┬──────────────────────┘
       │
       │ 6. generate(prompt)
       │ Escape & execute
       ↓
┌─────────────────────────────┐
│   Child Process             │
│   exec(`copilot "......"`)  │
└──────┬──────────────────────┘
       │
       │ 7. Spawn subprocess
       ↓
┌─────────────────────────────┐
│   Copilot CLI Binary        │
│   /usr/local/bin/copilot    │
└──────┬──────────────────────┘
       │
       │ 8. Authenticate & call
       │ GitHub Copilot API
       ↓
┌─────────────────────────────┐
│   GitHub Servers            │
│   Process & generate ideas  │
└──────┬──────────────────────┘
       │
       │ 9. Return JSON
       ↓
┌─────────────────────────────┐
│   Copilot CLI Binary        │
│   Output to stdout          │
└──────┬──────────────────────┘
       │
       │ 10. Capture stdout
       ↓
┌─────────────────────────────┐
│   Child Process             │
│   Return to Node.js         │
└──────┬──────────────────────┘
       │
       │ 11. Parse JSON
       ↓
┌─────────────────────────────┐
│   AIProvider                │
│   Return: string            │
└──────┬──────────────────────┘
       │
       │ 12. Extract & parse JSON
       ↓
┌─────────────────────────────┐
│   AgentProvider             │
│   Return: ideas array       │
└──────┬──────────────────────┘
       │
       │ 13. Format response
       │ {success, data}
       ↓
┌─────────────────────────────┐
│   API Route                 │
│   Return JSON response      │
└──────┬──────────────────────┘
       │
       │ 14. JSON response
       ↓
┌─────────────────────────────┐
│   Frontend                  │
│   Parse & display           │
└──────┬──────────────────────┘
       │
       │ 15. Show ideas in
       │ textarea & message
       ↓
┌─────────────────────────────┐
│   User                      │
│   Reviews ideas             │
│   Clicks "Import Ideas"     │
└─────────────────────────────┘
```

## Component Interactions

```
app/ideas/page.tsx (UI)
│
├─ useState: topic, generateLoading, ideaCount
├─ handleGenerateIdeas() [handler]
│   ├─ Validate topic
│   ├─ Fetch POST /api/ai/agent
│   ├─ Handle response
│   └─ Update UI state
│
└─ JSX Render
    ├─ Input: topic
    ├─ Input: count (1-50)
    ├─ Button: Generate Ideas
    ├─ Textarea: auto-populated with JSON
    ├─ Table: ideas list
    └─ Message: status/errors
    
        ↓ (calls)
        
pages/api/ai/agent.ts (Route)
│
├─ POST /api/ai/agent
├─ Validate: action, topic, count
├─ getAgentProvider()
│   └─ switch(action)
│       └─ case 'generateIdeas':
│           └─ agent.generateIdeas(topic, count)
│
└─ Return: {success, data}
    
    ↓ (uses)
    
lib/ai/agentProvider.ts (Business Logic)
│
├─ AgentProvider class
├─ constructor() → getAIProvider()
├─ async generateIdeas(topic, count, context)
│   ├─ Build prompt
│   ├─ Call baseProvider.generate(prompt, context)
│   ├─ Parse JSON response
│   ├─ Validate array
│   └─ Return ideas[]
│
└─ Uses: this.baseProvider
    
    ↓ (delegates to)
    
lib/ai/githubProvider.ts (AI Provider)
│
├─ GitHubModelsProvider class
├─ async generate(prompt, context)
│   ├─ Combine prompt + context
│   ├─ Escape quotes
│   ├─ Try candidates:
│   │   1. COPILOT_CLI_BIN env var
│   │   2. 'copilot' command
│   │   3. 'npx @githubnext/copilot-cli'
│   ├─ exec() → spawn child process
│   ├─ Capture stdout
│   ├─ Return trimmed output
│   └─ Throw error if all fail
│
└─ Uses: child_process.exec()
    
    ↓ (spawns)
    
Copilot CLI Binary
│
├─ /usr/local/bin/copilot
├─ Read stdin: prompt
├─ Authenticate with GitHub
├─ Call GitHub API
├─ Receive response
├─ Write JSON to stdout
└─ Exit
    
    ↓ (downloads from)
    
docker-compose.yml copilot_boot service
│
├─ Image: curlimages/curl:8.1.2
├─ Try download from:
│   1. copilot-linux-x64.tar.gz
│   2. copilot-linux-arm64.tar.gz
│   3. copilot-linuxmusl-x64.tar.gz
│   4. copilot-linuxmusl-arm64.tar.gz
├─ Extract tar.gz
├─ Make executable
├─ Store in volume: copilot_bin:/work
└─ Service completes
    
    ↓ (depends on)
    
web service
    ├─ Waits for copilot_boot completion
    ├─ Mounts copilot_bin volume
    ├─ npm install
    ├─ npm run dev
    └─ Ready on port 3000
```

## Environment Configuration

```
.env.local
│
├─ AI_PROVIDER=github
│   └─ Selects GitHubModelsProvider
│
└─ COPILOT_CLI_BIN=copilot
    └─ Sets CLI command to try first
```

## Error Handling Flow

```
User clicks Generate
    ↓
handleGenerateIdeas()
    │
    ├─ ERROR: Topic is empty
    │   └─ setMessage('Please enter a topic')
    │       └─ Show message, don't submit
    │
    ├─ TRY: fetch /api/ai/agent
    │   │
    │   ├─ Network error
    │   │   └─ catch → setMessage('Error: ...')
    │   │
    │   ├─ API error response
    │   │   └─ throw Error(json.error)
    │   │       └─ catch → setMessage('Error: ...')
    │   │
    │   ├─ Invalid response format
    │   │   └─ !json.success || !Array.isArray(json.data)
    │   │       └─ throw Error('Invalid response')
    │   │           └─ catch → setMessage('Error: ...')
    │   │
    │   └─ SUCCESS
    │       ├─ setText(JSON.stringify(ideas))
    │       ├─ setMessage('✓ Generated X ideas!...')
    │       └─ Textarea now shows ideas for import
    │
    └─ FINALLY
        └─ setGenerateLoading(false)

User clicks "Import Ideas"
    ↓
handleSubmit()
    │
    ├─ Parse textarea JSON
    ├─ POST /api/ideas
    └─ (existing flow)
```

## Performance Profile

```
Request Timeline:
│
├─ 0-100ms: Frontend validation & fetch
├─ 100-200ms: Network latency
├─ 200-300ms: API route processing
├─ 300-1000ms: AgentProvider setup
├─ 1000-2000ms: GitHubModelsProvider
│               (first call: CLI startup ~5000ms)
├─ 2000-3000ms: Child process execution
│               (copilot binary running)
├─ 3000-5000ms: Copilot API call to GitHub
├─ 5000-5200ms: Response parsing
├─ 5200-5300ms: Return to frontend
└─ 5300-5400ms: UI update

Total: ~2-5 seconds (subsequent)
       ~5-10 seconds (first call)
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Testable components
- ✅ Error handling at each layer
- ✅ Fallback strategies
- ✅ Performance optimization
- ✅ Scalable design

