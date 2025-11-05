import type { CustomField } from '@/types';

/**
 * 自訂欄位配對結果
 */
export type FieldPair =
  | { type: 'single-line'; field: CustomField }
  | { type: 'paired-lines'; fields: [CustomField, CustomField] }
  | { type: 'multi-line'; field: CustomField };

/**
 * 將自訂欄位按順序配對成渲染單元
 *
 * 規則：
 * 1. textarea/richtext 獨占一行
 * 2. 連續的兩個 input 配對成一行（兩欄）
 * 3. 單獨的 input 獨占一行（但仍在 grid 內）
 *
 * @param fields - 未排序的自訂欄位數組
 * @returns 配對後的渲染單元數組
 */
export function pairCustomFields(fields: CustomField[]): FieldPair[] {
  // 按 order 排序
  const sorted = [...fields].sort((a, b) => (a.order || 0) - (b.order || 0));
  const pairs: FieldPair[] = [];
  let i = 0;

  while (i < sorted.length) {
    const current = sorted[i];

    // 多行字段獨占
    if (current.fieldType === 'textarea' || current.fieldType === 'richtext') {
      pairs.push({ type: 'multi-line', field: current });
      i++;
      continue;
    }

    // 單行字段嘗試配對
    const next = sorted[i + 1];
    if (next && next.fieldType === 'input') {
      pairs.push({ type: 'paired-lines', fields: [current, next] });
      i += 2;
    } else {
      pairs.push({ type: 'single-line', field: current });
      i++;
    }
  }

  return pairs;
}
