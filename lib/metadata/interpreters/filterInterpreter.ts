import { FilterMetadata } from '@/components/admin/shared/MetadataCoreEngine';

export function processFilterMetadata(rawFilters: any[], dynamicOptionsMap: Record<string, Array<{ label: string; value: any }>> = {}): FilterMetadata[] {
  if (!Array.isArray(rawFilters)) return [];

  return rawFilters.map(filter => {
    let options = filter.options;

    if (filter.dynamicOptionKey && dynamicOptionsMap[filter.dynamicOptionKey]) {
      options = dynamicOptionsMap[filter.dynamicOptionKey];
    }

    return {
      key: filter.key,
      label: filter.label,
      type: filter.type || 'select',
      options: options,
      defaultValue: filter.defaultValue,
      placeholder: filter.placeholder
    };
  });
}
