import "server-only";
import { z } from "zod";

/** 환경 변수 누락 등 설정 문제 */
export class ApiConfigError extends Error {
  name = "ApiConfigError";
}

/** 서버가 오류 상태 코드를 돌려줬거나 연결에 실패함 */
export class ApiRequestError extends Error {
  name = "ApiRequestError";
  constructor(message: string, readonly path: string, readonly status?: number) {
    super(message);
  }
}

/** 응답 형식이 docs/api.md 계약과 다름 */
export class ApiContractError extends Error {
  name = "ApiContractError";
  constructor(message: string, readonly path: string) {
    super(message);
  }
}

type QueryValue = string | number | boolean | null | undefined;

function apiBase() {
  const base = process.env.WIBBLE_API_URL;
  if (!base) throw new ApiConfigError("WIBBLE_API_URL 환경 변수가 설정되지 않았어요. .env.example을 참고해 주세요.");
  return base.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${apiBase()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

type RequestOptions = {
  query?: Record<string, QueryValue>;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** 기본은 WIBBLE_API_TOKEN. 어드민 API는 WIBBLE_ADMIN_TOKEN을 넘긴다 */
  token?: string;
};

export async function request(path: string, { query, method = "GET", body, token = process.env.WIBBLE_API_TOKEN }: RequestOptions = {}) {
  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const timeout = Number(process.env.WIBBLE_API_TIMEOUT_MS) || 8000;
  try {
    return await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? `${timeout}ms 안에 응답이 없어요` : "연결하지 못했어요";
    throw new ApiRequestError(`API ${path}: ${reason}`, path);
  }
}

export async function parse<S extends z.ZodType>(response: Response, path: string, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiContractError(`API ${path}: JSON 응답이 아니에요`, path);
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiContractError(`API ${path}: 응답 형식이 계약과 달라요\n${z.prettifyError(result.error)}`, path);
  }
  return result.data;
}

/** GET 요청. 2xx가 아니면 오류를 던진다. */
export async function apiGet<S extends z.ZodType>(path: string, schema: S, query?: Record<string, QueryValue>) {
  const response = await request(path, { query });
  if (!response.ok) throw new ApiRequestError(`API ${path}: HTTP ${response.status}`, path, response.status);
  return parse(response, path, schema);
}

/** GET 요청. 404면 null을 돌려준다 (없는 테스트/결과 → notFound 처리용). */
export async function apiGetOrNull<S extends z.ZodType>(path: string, schema: S, query?: Record<string, QueryValue>) {
  const response = await request(path, { query });
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiRequestError(`API ${path}: HTTP ${response.status}`, path, response.status);
  return parse(response, path, schema);
}

/** 응답 본문이 없는 POST (방문·실행 기록 등). 2xx가 아니면 오류를 던진다. */
export async function apiPost(path: string, body: unknown) {
  const response = await request(path, { method: "POST", body });
  if (!response.ok) throw new ApiRequestError(`API ${path}: HTTP ${response.status}`, path, response.status);
}
