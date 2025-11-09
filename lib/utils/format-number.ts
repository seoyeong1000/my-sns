/**
 * @file format-number.ts
 * @description 숫자 포맷팅 유틸리티 함수
 *
 * Instagram 스타일의 숫자 표시를 위한 함수입니다.
 * 예: "1,234", "12.3K", "1.2M" 등
 */

/**
 * 숫자를 포맷팅합니다.
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "1,234", "12.3K", "1.2M")
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    // 천 단위 (K)
    const thousands = num / 1000;
    if (thousands % 1 === 0) {
      return `${thousands}K`;
    }
    return `${thousands.toFixed(1)}K`;
  }

  if (num < 1000000000) {
    // 백만 단위 (M)
    const millions = num / 1000000;
    if (millions % 1 === 0) {
      return `${millions}M`;
    }
    return `${millions.toFixed(1)}M`;
  }

  // 십억 단위 (B)
  const billions = num / 1000000000;
  if (billions % 1 === 0) {
    return `${billions}B`;
  }
  return `${billions.toFixed(1)}B`;
}


