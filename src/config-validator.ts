import { localize } from './localize/localize';
import { LogbookCardConfigBase } from './types';

export const checkBaseConfig = (config: LogbookCardConfigBase): void => {
  if (!config) {
    throw new Error(localize('common.invalid_configuration'));
  }
  if (config.max_items !== undefined && !Number.isInteger(config.max_items)) {
    throw new Error('max_items must be an Integer.');
  }
  if (config.desc && typeof config.desc !== 'boolean') {
    throw new Error('desc must be a boolean');
  }
  if (config.collapse && !Number.isInteger(config.collapse)) {
    throw new Error('collapse must be a number');
  }
  if (config.collapse && config.max_items && config.max_items > 0 && config.collapse > config.max_items) {
    throw new Error('collapse must be lower than max-items');
  }
  if (config.duration?.units && !Array.isArray(config.duration.units)) {
    throw new Error('duration.units must be an array');
  }
  if (config.duration?.largest && !Number.isInteger(config.duration.largest) && config.duration.largest !== 'full') {
    throw new Error('duration.largest should be a number or `full`');
  }
  if (config.minimal_duration && !Number.isInteger(config.minimal_duration) && config.minimal_duration <= 0) {
    throw new Error('minimal_duration should be a positive number');
  }
};
