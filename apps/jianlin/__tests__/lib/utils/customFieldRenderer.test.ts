import { describe, it, expect } from 'vitest';
import { pairCustomFields } from '@/lib/utils/customFieldRenderer';
import type { CustomField } from '@/types';

describe('pairCustomFields', () => {
  it('should handle empty array', () => {
    expect(pairCustomFields([])).toEqual([]);
  });

  it('should sort fields by order', () => {
    const fields: CustomField[] = [
      { id: '2', label: 'Second', fieldType: 'input', value: 'B', order: 1 },
      { id: '1', label: 'First', fieldType: 'input', value: 'A', order: 0 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'paired-lines',
      fields: [
        { id: '1', label: 'First', fieldType: 'input', value: 'A', order: 0 },
        { id: '2', label: 'Second', fieldType: 'input', value: 'B', order: 1 },
      ],
    });
  });

  it('should pair two consecutive input fields', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'Field 1', fieldType: 'input', value: 'Value 1', order: 0 },
      { id: '2', label: 'Field 2', fieldType: 'input', value: 'Value 2', order: 1 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'paired-lines',
      fields: [fields[0], fields[1]],
    });
  });

  it('should render single input field when no pair available', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'Single', fieldType: 'input', value: 'Value', order: 0 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'single-line',
      field: fields[0],
    });
  });

  it('should render textarea as multi-line', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'Description', fieldType: 'textarea', value: 'Long\ntext', order: 0 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'multi-line',
      field: fields[0],
    });
  });

  it('should render richtext as multi-line', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'Content', fieldType: 'richtext', value: '<p>HTML</p>', order: 0 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'multi-line',
      field: fields[0],
    });
  });

  it('should not pair input with textarea', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'Input', fieldType: 'input', value: 'Value', order: 0 },
      { id: '2', label: 'Textarea', fieldType: 'textarea', value: 'Long text', order: 1 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: 'single-line',
      field: fields[0],
    });
    expect(result[1]).toEqual({
      type: 'multi-line',
      field: fields[1],
    });
  });

  it('should handle complex mixed scenario: textarea -> input', () => {
    const fields: CustomField[] = [
      { id: '1', label: '車位類型', fieldType: 'textarea', value: '平面車位\n機械車位', order: 0 },
      { id: '2', label: '車位數量', fieldType: 'input', value: '2', order: 1 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      type: 'multi-line',
      field: fields[0],
    });
    expect(result[1]).toEqual({
      type: 'single-line',
      field: fields[1],
    });
  });

  it('should handle complex scenario: input -> input -> textarea -> input -> input', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'A', fieldType: 'input', value: '1', order: 0 },
      { id: '2', label: 'B', fieldType: 'input', value: '2', order: 1 },
      { id: '3', label: 'C', fieldType: 'textarea', value: 'Long', order: 2 },
      { id: '4', label: 'D', fieldType: 'input', value: '4', order: 3 },
      { id: '5', label: 'E', fieldType: 'input', value: '5', order: 4 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(3);

    // A + B paired
    expect(result[0]).toEqual({
      type: 'paired-lines',
      fields: [fields[0], fields[1]],
    });

    // C alone
    expect(result[1]).toEqual({
      type: 'multi-line',
      field: fields[2],
    });

    // D + E paired
    expect(result[2]).toEqual({
      type: 'paired-lines',
      fields: [fields[3], fields[4]],
    });
  });

  it('should handle odd number of inputs', () => {
    const fields: CustomField[] = [
      { id: '1', label: 'A', fieldType: 'input', value: '1', order: 0 },
      { id: '2', label: 'B', fieldType: 'input', value: '2', order: 1 },
      { id: '3', label: 'C', fieldType: 'input', value: '3', order: 2 },
    ];

    const result = pairCustomFields(fields);

    expect(result).toHaveLength(2);

    // A + B paired
    expect(result[0]).toEqual({
      type: 'paired-lines',
      fields: [fields[0], fields[1]],
    });

    // C alone
    expect(result[1]).toEqual({
      type: 'single-line',
      field: fields[2],
    });
  });

  it('should not mutate original array', () => {
    const fields: CustomField[] = [
      { id: '2', label: 'Second', fieldType: 'input', value: 'B', order: 1 },
      { id: '1', label: 'First', fieldType: 'input', value: 'A', order: 0 },
    ];

    const original = [...fields];
    pairCustomFields(fields);

    expect(fields).toEqual(original);
  });
});
