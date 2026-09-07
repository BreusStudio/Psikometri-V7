import { FormFieldMetadata } from '@/components/admin/shared/FormGenerator';

export function processFormFields(rawFields: any[], dynamicOptionsMap: Record<string, Array<{ label: string; value: any }>> = {}): FormFieldMetadata[] {
  if (!Array.isArray(rawFields)) return [];

  return rawFields.map(field => {
    let options = field.options;

    if (field.dynamicOptionKey && dynamicOptionsMap[field.dynamicOptionKey]) {
      options = dynamicOptionsMap[field.dynamicOptionKey];
    }

    return {
      key: field.key,
      label: field.label,
      type: field.type || 'text',
      placeholder: field.placeholder,
      required: field.required ?? false,
      defaultValue: field.defaultValue,
      options: options,
      validation: field.validation,
      description: field.description,
      gridCols: field.gridCols,
      disabled: field.disabled
    };
  });
}
