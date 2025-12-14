# HTTP API 테스트 예제

MCP Gemini HTTP API 서버 사용 예제입니다.

## 서버 시작

```bash
# HTTP 서버 시작
yarn http

# 개발 모드 (파일 변경 감지)
yarn http:dev
```

## API 엔드포인트

### 1. 서버 상태 확인

```bash
curl http://localhost:3000/health
```

**응답:**

```json
{
  "status": "ok",
  "timestamp": "2024-12-14T10:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. API 정보

```bash
curl http://localhost:3000/api/info
```

### 3. 텍스트 생성

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Python으로 피보나치 수열을 구현해줘",
    "temperature": 0.3
  }'
```

**응답:**

```json
{
  "success": true,
  "text": "Python에서 피보나치 수열을 구현하는 방법...",
  "metadata": {
    "promptLength": 25,
    "responseLength": 450,
    "duration": "1200ms",
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.3
  }
}
```

### 4. 대화형 채팅

#### 기본 세션으로 채팅

```bash
# 첫 번째 메시지
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕! Node.js에 대해 배우고 싶어"
  }'

# 두 번째 메시지 (컨텍스트 유지)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "비동기 프로그래밍은 뭐야?"
  }'
```

#### 특정 세션으로 채팅

```bash
# 세션 ID: user123
curl -X POST http://localhost:3000/api/chat/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "React Hooks에 대해 설명해줘"
  }'
```

**응답:**

```json
{
  "success": true,
  "response": "React Hooks는 함수형 컴포넌트에서...",
  "metadata": {
    "sessionId": "user123",
    "messageCount": 1,
    "messageLength": 20,
    "responseLength": 350,
    "duration": "950ms",
    "model": "gemini-2.0-flash-exp",
    "createdAt": "2024-12-14T10:00:00.000Z"
  }
}
```

### 5. 세션 관리

#### 활성 세션 목록

```bash
curl http://localhost:3000/api/sessions
```

**응답:**

```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "default",
      "createdAt": "2024-12-14T10:00:00.000Z"
    },
    {
      "sessionId": "user123",
      "createdAt": "2024-12-14T10:05:00.000Z"
    }
  ],
  "count": 2
}
```

#### 세션 삭제

```bash
curl -X DELETE http://localhost:3000/api/sessions/user123
```

**응답:**

```json
{
  "success": true,
  "message": "세션 user123가 삭제되었습니다"
}
```

### 6. 일본어→한국어 번역

일본어 텍스트를 한국어로 자연스럽게 번역합니다.

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "ありがとうございます。今日はとても良い天気ですね。"
  }'
```

**응답:**

```json
{
  "success": true,
  "original": "ありがとうございます。今日はとても良い天気ですね。",
  "translation": "감사합니다. 오늘은 정말 좋은 날씨네요.",
  "metadata": {
    "originalLength": 26,
    "translationLength": 22,
    "duration": "1100ms",
    "model": "gemini-2.5-flash",
    "sourceLanguage": "ja",
    "targetLanguage": "ko"
  }
}
```

**PowerShell에서:**

```powershell
$body = @{
    text = "日本語を韓国語に翻訳してください"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/translate `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**긴 텍스트 번역 예시:**

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "私は毎日プログラミングの勉強をしています。特にJavaScriptとPythonが好きです。将来はソフトウェアエンジニアになりたいと思っています。"
  }'
```

### 7. 사용 가능한 모델 목록

현재 API 키로 사용 가능한 Gemini 모델 목록을 확인합니다.

```bash
curl http://localhost:3000/api/models
```

**응답:**

```json
{
  "success": true,
  "currentModel": "gemini-2.5-flash",
  "models": [
    {
      "name": "gemini-2.5-flash",
      "displayName": "Gemini 2.5 Flash",
      "description": "Stable version of Gemini 2.5 Flash...",
      "supportedGenerationMethods": ["generateContent", "countTokens", ...]
    },
    ...
  ]
}
```

## JavaScript 예제

```javascript
// 텍스트 생성
async function generateText(prompt, temperature = 0.7) {
  const response = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, temperature }),
  });

  const result = await response.json();
  return result.success ? result.text : null;
}

// 채팅
async function chat(message, sessionId = "default") {
  const url =
    sessionId === "default"
      ? "http://localhost:3000/api/chat"
      : `http://localhost:3000/api/chat/${sessionId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const result = await response.json();
  return result.success ? result.response : null;
}

// 번역
async function translate(text) {
  const response = await fetch("http://localhost:3000/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const result = await response.json();
  return result.success ? result.translation : null;
}

// 사용 예시
const text = await generateText("Hello, Gemini!");
const response = await chat("안녕하세요!", "user123");
const translation = await translate("ありがとうございます");
```

## Python 예제

```python
import requests
import json

BASE_URL = "http://localhost:3000"

def generate_text(prompt, temperature=0.7):
    """텍스트 생성"""
    response = requests.post(f"{BASE_URL}/api/generate",
        json={"prompt": prompt, "temperature": temperature})

    if response.status_code == 200:
        result = response.json()
        return result["text"] if result["success"] else None
    return None

def chat(message, session_id="default"):
    """채팅"""
    url = f"{BASE_URL}/api/chat"
    if session_id != "default":
        url = f"{BASE_URL}/api/chat/{session_id}"

    response = requests.post(url, json={"message": message})

    if response.status_code == 200:
        result = response.json()
        return result["response"] if result["success"] else None
    return None

def get_sessions():
    """세션 목록"""
    response = requests.get(f"{BASE_URL}/api/sessions")
    if response.status_code == 200:
        result = response.json()
        return result["sessions"] if result["success"] else []
    return []

def delete_session(session_id):
    """세션 삭제"""
    response = requests.delete(f"{BASE_URL}/api/sessions/{session_id}")
    return response.status_code == 200

def translate(text):
    """일본어→한국어 번역"""
    response = requests.post(f"{BASE_URL}/api/translate",
        json={"text": text})

    if response.status_code == 200:
        result = response.json()
        return result["translation"] if result["success"] else None
    return None

# 사용 예시
if __name__ == "__main__":
    # 텍스트 생성
    text = generate_text("Python으로 Hello World 출력하기")
    print("생성된 텍스트:", text)

    # 채팅
    response1 = chat("안녕하세요!", "python_user")
    print("첫 번째 응답:", response1)

    response2 = chat("Python에 대해 알려주세요", "python_user")
    print("두 번째 응답:", response2)

    # 세션 목록
    sessions = get_sessions()
    print("활성 세션:", sessions)

    # 번역
    translation = translate("ありがとうございます")
    print("번역 결과:", translation)
```

## 에러 처리

### 400 Bad Request

```json
{
  "success": false,
  "error": "prompt는 필수 파라미터입니다"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Resource has been exhausted (e.g. check quota)"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "엔드포인트를 찾을 수 없습니다",
  "availableEndpoints": [...]
}
```

## 환경 변수

```env
GEMINI_API_KEY=your_api_key_here
PORT=3000  # 선택사항, 기본값 3000
```

## 로그 확인

서버 실행 시 stderr로 로그가 출력됩니다:

```
[2024-12-14T10:00:00.000Z] POST /api/generate
텍스트 생성 완료: 1200ms, 450자
[2024-12-14T10:01:00.000Z] POST /api/chat/user123
새 채팅 세션 생성: user123
채팅 응답 완료 [user123]: 950ms, 350자
```
