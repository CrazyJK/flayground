# MCP Gemini Server

Google Gemini 무료 API를 MCP (Model Context Protocol) 표준으로 제공하는 서버입니다.

## 📋 목차

- [개요](#개요)
- [현재 구성](#현재-구성)
- [제공 기능](#제공-기능)
- [시작하기](#시작하기)
- [사용법](#사용법)
- [확장 가능 예시](#확장-가능-예시)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)
- [라이선스](#라이선스)

## 개요

MCP Gemini Server는 Google의 Gemini AI 모델을 Model Context Protocol(MCP) 표준을 통해 제공하는 경량 서버입니다. Claude Desktop, Cline과 같은 MCP 클라이언트에서 Gemini의 무료 API를 활용할 수 있습니다.

### 주요 특징

- 🆓 **무료 사용**: Gemini API 무료 티어 활용
- ⚡ **최신 모델**: `gemini-2.0-flash-exp` 모델 지원
- 🔌 **MCP 표준**: MCP 프로토콜 완벽 준수
- 💬 **대화 컨텍스트**: 멀티턴 대화 세션 유지
- 🛠️ **확장 가능**: 쉽게 새로운 도구 추가 가능

## 현재 구성

### 프로젝트 구조

```
mcp-gemini/
├── src/
│   ├── index.ts           # 애플리케이션 진입점 (TypeScript)
│   ├── config.ts          # 환경 설정 관리 (API 키, 모델 설정)
│   ├── gemini-client.ts   # Gemini API 클라이언트 래퍼
│   ├── mcp-server.ts      # MCP 프로토콜 서버 구현
│   └── http-server.ts     # HTTP REST API 서버 구현
├── dist/                  # TypeScript 컴파일 결과물 (생성됨)
├── .env.example           # 환경 변수 템플릿
├── tsconfig.json          # TypeScript 설정
├── package.json           # 프로젝트 의존성
└── README.md              # 프로젝트 문서 (이 파일)
```

### 핵심 모듈

#### 1. `index.ts` - 메인 엔트리포인트 (TypeScript)

```javascript
// 서버 초기화 및 실행
validateConfig()           // 환경 변수 검증
GeminiClient 생성          // Gemini API 클라이언트
MCPServer 생성 및 실행     // MCP 서버 시작
```

#### 2. `config.js` - 설정 관리

```javascript
export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY, // API 키
  mcp: {
    serverName: "gemini-server",
    serverVersion: "1.0.0",
  },
  gemini: {
    model: "gemini-2.0-flash-exp", // 사용 모델
    maxOutputTokens: 8192, // 최대 출력 토큰
    temperature: 0.7, // 기본 생성 온도
  },
};
```

#### 3. `gemini-client.js` - Gemini API 래퍼

**제공 메서드:**

- `generateText(prompt, options)` - 단일 텍스트 생성
- `generateTextStream(prompt, onChunk)` - 스트리밍 생성
- `startChat()` - 대화 세션 시작

**주요 기능:**

```javascript
// 텍스트 생성
const text = await client.generateText("프롬프트", {
  temperature: 0.7,
  maxOutputTokens: 2048,
});

// 대화 세션
const chat = client.startChat();
const result = await chat.sendMessage("메시지");
```

#### 4. `mcp-server.js` - MCP 프로토콜 구현

**구현된 핸들러:**

- `ListToolsRequest` - 사용 가능한 도구 목록 반환
- `CallToolRequest` - 도구 실행 처리

**도구 라우팅:**

```javascript
switch (request.params.name) {
  case "generate_text":
    return await handleGenerateText(args);
  case "chat":
    return await handleChat(args);
  default:
    throw new Error("알 수 없는 도구");
}
```

### 의존성

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0", // MCP 표준 SDK
  "@google/generative-ai": "^0.21.0", // Gemini API SDK
  "dotenv": "^16.4.5" // 환경 변수 관리
}
```

## 제공 기능

### 1. 텍스트 생성 (`generate_text`)

단일 프롬프트로 텍스트를 생성합니다.

**입력 스키마:**

| 파라미터      | 타입   | 필수 | 기본값 | 설명                     |
| ------------- | ------ | ---- | ------ | ------------------------ |
| `prompt`      | string | ✅   | -      | 생성할 텍스트의 프롬프트 |
| `temperature` | number | ❌   | 0.7    | 생성 온도 (0.0 ~ 2.0)    |

**출력:**

```typescript
{
  content: [
    {
      type: "text",
      text: string, // 생성된 텍스트
    },
  ];
}
```

**사용 예시:**

```javascript
// Claude Desktop에서
"Python으로 퀵소트 알고리즘을 구현해줘"

// MCP 클라이언트에서
{
  "name": "generate_text",
  "arguments": {
    "prompt": "Python으로 퀵소트 알고리즘을 구현해줘",
    "temperature": 0.3
  }
}
```

### 2. 대화형 채팅 (`chat`)

이전 대화를 기억하는 멀티턴 대화를 수행합니다.

**입력 스키마:**

| 파라미터  | 타입   | 필수 | 설명        |
| --------- | ------ | ---- | ----------- |
| `message` | string | ✅   | 채팅 메시지 |

**출력:**

```typescript
{
  content: [
    {
      type: "text",
      text: string, // 응답 메시지
    },
  ];
}
```

**대화 흐름:**

```javascript
// 첫 번째 메시지
chat("안녕! Node.js에 대해 배우고 싶어");
// → "안녕하세요! Node.js를 배우시려는군요..."

// 두 번째 메시지 (컨텍스트 유지)
chat("비동기 프로그래밍은 뭐야?");
// → "Node.js의 비동기 프로그래밍은..." (이전 대화 기억)

// 세 번째 메시지
chat("Promise 예제를 보여줘");
// → "Promise를 사용한 예제입니다..." (계속 컨텍스트 유지)
```

### 3. 오류 처리

모든 도구는 표준화된 오류 응답을 반환합니다.

```typescript
{
  content: [
    {
      type: "text",
      text: "오류 발생: {error.message}"
    }
  ],
  isError: true
}
```

## 시작하기

### 사전 요구사항

- Node.js 18.0.0 이상
- yarn 패키지 매니저
- Google Gemini API 키 ([무료 발급](https://makersuite.google.com/app/apikey))

### 설치

1. **의존성 설치**

```bash
cd mcp-gemini
yarn install
```

2. **환경 변수 설정**

`.env.example`을 `.env`로 복사하고 API 키 설정:

```bash
cp .env.example .env
```

`.env` 파일:

```env
GEMINI_API_KEY=your_api_key_here
MCP_SERVER_NAME=gemini-server
MCP_SERVER_VERSION=1.0.0
```

3. **서버 실행**

```bash
# 프로덕션 모드
yarn start

# 개발 모드 (파일 변경 감지)
yarn dev
```

성공 메시지:

```
MCP Gemini 서버가 시작되었습니다.
```

## 사용법

### Claude Desktop 연동

1. **설정 파일 열기**

   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **서버 추가**

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": [
        "c:\\kamoru\\Workspace\\git\\flayground\\mcp-gemini\\src\\index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

3. **Claude Desktop 재시작**

4. **도구 사용**
   - 채팅 창에서 🔧 아이콘 클릭
   - `generate_text`, `chat` 도구 확인

### Cline (VS Code) 연동

1. VS Code에서 Cline 확장 설치
2. MCP Settings에서 서버 추가
3. Cline에서 Gemini 도구 사용

### 직접 MCP 클라이언트 구현

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./src/index.js"],
  env: { GEMINI_API_KEY: "your_api_key" },
});

const client = new Client(
  {
    name: "my-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);

// 도구 호출
const result = await client.callTool({
  name: "generate_text",
  arguments: { prompt: "Hello!" },
});
```

## 확장 가능 예시

### 1. 새로운 도구 추가하기

**예시: 코드 리뷰 도구**

#### 1단계: `mcp-server.js`에 도구 정의 추가

```javascript
setupHandlers() {
  this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // 기존 도구들...
      {
        name: "code_review",
        description: "코드를 분석하고 개선점을 제안",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "리뷰할 코드"
            },
            language: {
              type: "string",
              description: "프로그래밍 언어"
            }
          },
          required: ["code", "language"]
        }
      }
    ]
  }));
}
```

#### 2단계: 도구 라우팅 추가

```javascript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_text":
      return await this.handleGenerateText(request.params.arguments);
    case "chat":
      return await this.handleChat(request.params.arguments);
    case "code_review": // 새 도구
      return await this.handleCodeReview(request.params.arguments);
    default:
      throw new Error(`알 수 없는 도구: ${request.params.name}`);
  }
});
```

#### 3단계: 핸들러 메서드 구현

```javascript
/**
 * 코드 리뷰 처리
 * @param {Object} args - 인자
 * @returns {Promise<Object>} 응답
 */
async handleCodeReview(args) {
  const { code, language } = args;

  const prompt = `다음 ${language} 코드를 리뷰하고 개선점을 제안해주세요:

\`\`\`${language}
${code}
\`\`\`

다음 항목을 분석해주세요:
1. 코드 품질 및 가독성
2. 성능 최적화 가능성
3. 보안 이슈
4. 베스트 프랙티스 준수 여부
5. 구체적인 개선 제안`;

  const text = await this.geminiClient.generateText(prompt, {
    temperature: 0.3  // 분석적 작업이므로 낮은 온도
  });

  return {
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}
```

### 2. 이미지 분석 도구 추가 (향후)

```javascript
{
  name: "analyze_image",
  description: "이미지를 분석하고 설명 생성",
  inputSchema: {
    type: "object",
    properties: {
      imageUrl: { type: "string", description: "이미지 URL" },
      prompt: { type: "string", description: "분석 요청사항" }
    },
    required: ["imageUrl"]
  }
}

async handleAnalyzeImage(args) {
  const { imageUrl, prompt } = args;

  // Gemini Vision API 사용
  const model = this.geminiClient.genAI.getGenerativeModel({
    model: "gemini-pro-vision"
  });

  const imagePart = {
    inlineData: {
      data: await fetchImageAsBase64(imageUrl),
      mimeType: "image/jpeg"
    }
  };

  const result = await model.generateContent([
    prompt || "이 이미지를 자세히 설명해주세요",
    imagePart
  ]);

  return {
    content: [{ type: "text", text: result.response.text() }]
  };
}
```

### 3. 문서 요약 도구

```javascript
{
  name: "summarize_document",
  description: "긴 문서를 요약",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "요약할 문서" },
      length: {
        type: "string",
        enum: ["short", "medium", "long"],
        description: "요약 길이"
      }
    },
    required: ["text"]
  }
}

async handleSummarizeDocument(args) {
  const { text, length = "medium" } = args;

  const lengthGuide = {
    short: "3-5문장",
    medium: "1-2단락",
    long: "3-4단락"
  };

  const prompt = `다음 문서를 ${lengthGuide[length]} 길이로 요약해주세요:

${text}

핵심 내용만 간결하게 요약하되, 중요한 정보는 빠뜨리지 마세요.`;

  const summary = await this.geminiClient.generateText(prompt, {
    temperature: 0.4
  });

  return {
    content: [{ type: "text", text: summary }]
  };
}
```

### 4. 다국어 번역 도구

```javascript
{
  name: "translate",
  description: "텍스트를 다른 언어로 번역",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "번역할 텍스트" },
      targetLanguage: { type: "string", description: "목표 언어" },
      sourceLanguage: { type: "string", description: "원본 언어 (선택)" }
    },
    required: ["text", "targetLanguage"]
  }
}

async handleTranslate(args) {
  const { text, targetLanguage, sourceLanguage } = args;

  const prompt = sourceLanguage
    ? `다음 ${sourceLanguage} 텍스트를 ${targetLanguage}로 번역해주세요:\n\n${text}`
    : `다음 텍스트를 ${targetLanguage}로 번역해주세요:\n\n${text}`;

  const translation = await this.geminiClient.generateText(prompt, {
    temperature: 0.3  // 정확한 번역을 위해 낮은 온도
  });

  return {
    content: [{ type: "text", text: translation }]
  };
}
```

### 5. 커스텀 설정 적용

#### 모델 변경

```javascript
// src/config.js
export const config = {
  gemini: {
    model: "gemini-1.5-pro", // 더 강력한 모델로 변경
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
};
```

#### 특정 도구에 다른 모델 사용

```javascript
// src/mcp-server.js
async handleCodeReview(args) {
  // Pro 모델 사용
  const proModel = this.geminiClient.genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
  });

  const result = await proModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048
    }
  });

  return {
    content: [{ type: "text", text: result.response.text() }]
  };
}
```

### 6. 로깅 및 모니터링 추가

```javascript
// src/mcp-server.js
async handleGenerateText(args) {
  const startTime = Date.now();

  try {
    console.error(`[${new Date().toISOString()}] generate_text 호출`);
    console.error(`프롬프트 길이: ${args.prompt.length}자`);

    const text = await this.geminiClient.generateText(
      args.prompt,
      { temperature: args.temperature }
    );

    const duration = Date.now() - startTime;
    console.error(`응답 시간: ${duration}ms`);
    console.error(`응답 길이: ${text.length}자`);

    return {
      content: [{ type: "text", text }]
    };
  } catch (error) {
    console.error(`[오류] ${error.message}`);
    throw error;
  }
}
```

### 7. Rate Limiting 추가

```javascript
// src/rate-limiter.js
export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitIfNeeded() {
    const now = Date.now();
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      console.error(`Rate limit 도달. ${waitTime}ms 대기...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

// src/mcp-server.js 에서 사용
import { RateLimiter } from './rate-limiter.js';

constructor(geminiClient) {
  this.rateLimiter = new RateLimiter(15, 60000); // 분당 15 요청
  // ...
}

async handleGenerateText(args) {
  await this.rateLimiter.waitIfNeeded();
  // ... 나머지 로직
}
```

## API 문서

자세한 API 스펙은 [API.md](./API.md) 문서를 참조하세요.

주요 내용:

- MCP 프로토콜 상세 스펙
- 요청/응답 형식
- 오류 처리
- 통합 예제 (Python, JavaScript)
- Rate Limiting 정보

## 문제 해결

### API 키 오류

```
오류: GEMINI_API_KEY가 설정되지 않았습니다
```

**해결:** `.env` 파일에 API 키 추가

```env
GEMINI_API_KEY=your_api_key_here
```

### Rate Limit 오류

```
Resource has been exhausted (e.g. check quota)
```

**해결:**

- 무료 할당량: 분당 15 요청, 일일 1,500 요청
- 잠시 대기 후 재시도
- [할당량 확인](https://makersuite.google.com)

### Claude Desktop에서 도구가 안 보임

**해결:**

1. `claude_desktop_config.json` 경로 확인
2. JSON 형식 오류 확인
3. 경로에 백슬래시 이스케이프: `c:\\path\\to\\file`
4. Claude Desktop 완전 재시작

### 서버 시작 실패

**해결:**

1. Node.js 버전 확인 (18+ 필요)
2. 의존성 재설치: `yarn install`
3. 환경 변수 확인

## 라이선스

MIT License

## 관련 링크

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [Google Gemini API](https://ai.google.dev/docs)
- [API 상세 스펙](./API.md)

---

**버전**: 1.0.0  
**마지막 업데이트**: 2024-12-14
