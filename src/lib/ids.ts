/** URL에 그대로 들어가는 식별자(테스트 slug, 결과 id) 형식. 서버와 게임 모두 이 규칙을 따른다. */
export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export const isValidId = (value: unknown): value is string =>
  typeof value === "string" && ID_PATTERN.test(value);
