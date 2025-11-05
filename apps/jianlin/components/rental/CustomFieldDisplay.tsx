import type { CustomField } from '@/types';

/**
 * 渲染單個欄位（label + value）
 */
function FieldItem({ field }: { field: CustomField }) {
  return (
    <div className="flex">
      <span className="text-[#6c757d] min-w-[80px]">{field.label}：</span>
      {field.fieldType === 'richtext' ? (
        <div
          className="text-[#2c3e50] prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: field.value }}
        />
      ) : (
        <span className="text-[#2c3e50] whitespace-pre-wrap">{field.value}</span>
      )}
    </div>
  );
}

/**
 * 多行欄位顯示（全寬）
 */
export function MultiLineField({ field }: { field: CustomField }) {
  return <FieldItem field={field} />;
}

/**
 * 單個單行欄位顯示（在 Grid 容器內）
 */
export function SingleLineField({ field }: { field: CustomField }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldItem field={field} />
    </div>
  );
}

/**
 * 配對的單行欄位顯示（兩欄 Grid）
 */
export function PairedLineFields({ fields }: { fields: [CustomField, CustomField] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldItem field={fields[0]} />
      <FieldItem field={fields[1]} />
    </div>
  );
}
