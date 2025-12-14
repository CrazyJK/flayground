import type { AIResponse, AIVendor, GenerateOptions } from './types';

/**
 * MCP Gemini HTTP 서버 기반 AI 서비스
 *
 * 별도 Node.js 서버(http-server.ts)를 통해 AI 호출
 * API 키가 서버에서만 관리되어 안전
 *
 * @example
 * ```typescript
 * import { generate, translate } from '@/ai';
 *
 * const response = await generate('안녕하세요');
 * console.log(response.text);
 * ```
 */

// mcp-gemini HTTP 서버 주소
const API_BASE = 'http://localhost:3000/api';

/**
 * AI 텍스트 생성
 *
 * @param prompt - 프롬프트
 * @param options - 생성 옵션
 * @returns AI 응답
 */
export async function generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'AI 생성 실패');
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    return {
      text: data.text,
      vendor: data.vendor || ('unknown' as AIVendor),
      duration,
    };
  } catch (error) {
    throw new Error(`AI 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 텍스트 번역
 *
 * @param text - 번역할 텍스트
 * @param sourceLang - 원본 언어
 * @param targetLang - 목표 언어
 * @returns AI 응답
 */
export async function translate(text: string, sourceLang: string, targetLang: string): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || '번역 실패');
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    return {
      text: data.translation || data.text,
      vendor: data.vendor || ('unknown' as AIVendor),
      duration,
    };
  } catch (error) {
    throw new Error(`번역 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 현재 사용 중인 AI 벤더 가져오기
 * @returns 벤더 이름
 */
export async function getCurrentVendor(): Promise<AIVendor> {
  try {
    const response = await fetch(`${API_BASE}/info`);
    const data = await response.json();
    return data.vendor || ('unknown' as AIVendor);
  } catch {
    return 'unknown' as AIVendor;
  }
}

// 타입 내보내기
export type { AIResponse, AIVendor, GenerateOptions } from './types';
