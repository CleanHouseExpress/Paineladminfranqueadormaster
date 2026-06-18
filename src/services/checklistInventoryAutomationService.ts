import { apiClient } from './apiClient';

export type InventoryAutomationMovementType = 'exit' | 'entry' | 'adjustment' | 'loss';

export interface InventoryAutomationRule {
  id?: number;
  sourceFieldKey: string;
  fieldLabel: string;
  fieldType?: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUnit?: string | null;
  movementType: InventoryAutomationMovementType;
  multiplier: number;
  active: boolean;
}

interface ApiRule {
  id: number;
  source_field_key: string;
  field_label: string;
  field_type?: string | null;
  inventory_item_id: number | string;
  inventory_item_name: string;
  inventory_item_unit?: string | null;
  movement_type: InventoryAutomationMovementType;
  multiplier: number | string;
  active: boolean;
}

interface DataResponse<T> {
  data: T;
}

function toRule(rule: ApiRule): InventoryAutomationRule {
  return {
    id: rule.id,
    sourceFieldKey: rule.source_field_key,
    fieldLabel: rule.field_label,
    fieldType: rule.field_type,
    inventoryItemId: String(rule.inventory_item_id),
    inventoryItemName: rule.inventory_item_name,
    inventoryItemUnit: rule.inventory_item_unit,
    movementType: rule.movement_type,
    multiplier: Number(rule.multiplier),
    active: rule.active,
  };
}

export const checklistInventoryAutomationService = {
  getRules: async (templateId: string | number) => {
    const response = await apiClient.get<DataResponse<ApiRule[]>>(
      `/api/company/checklists/templates/${templateId}/inventory-rules`,
    );

    return response.data.map(toRule);
  },

  saveRules: async (
    templateId: string | number,
    rules: InventoryAutomationRule[],
  ) => {
    const response = await apiClient.put<DataResponse<ApiRule[]>>(
      `/api/company/checklists/templates/${templateId}/inventory-rules`,
      {
        rules: rules.map(rule => ({
          source_field_key: rule.sourceFieldKey,
          inventory_item_id: Number(rule.inventoryItemId),
          movement_type: rule.movementType,
          multiplier: rule.multiplier,
          active: rule.active,
        })),
      },
    );

    return response.data.map(toRule);
  },
};
