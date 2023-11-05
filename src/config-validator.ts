import { localize } from './localize/localize';
import { LogbookCardConfigBase } from './types';

export const checkBaseConfig = (config: LogbookCardConfigBase): void => {
  if (!config) {
    throw new Error(localize('common.invalid_configuration'));
  }
  if (config.max_items !== undefined && !Number.isInteger(config.max_items)) {
    throw new Error(localize('common.invalid_max_items'));
  }
  if (config.desc && typeof config.desc !== 'boolean') {
    throw new Error(localize('common.invalid_desc'));
  }
  if (config.collapse && !Number.isInteger(config.collapse)) {
    throw new Error(localize('common.invalid_collapse'));
  }
  if (config.collapse && config.max_items && config.max_items > 0 && config.collapse > config.max_items) {
    throw new Error(localize('common.collapse_greater_than_max_items'));
  }
  if (config.duration?.units && !Array.isArray(config.duration.units)) {
    throw new Error(localize('common.invalid_duration_units'));
  }
  if (config.duration?.largest && !Number.isInteger(config.duration.largest) && config.duration.largest !== 'full') {
    throw new Error(localize('common.invalid_duration_largest'));
  }
  if (config.minimal_duration && !Number.isInteger(config.minimal_duration) && config.minimal_duration <= 0) {
    throw new Error(localize('common.invalid_minimal_duration'));
  }
};
