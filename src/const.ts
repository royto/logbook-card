import { ShowConfiguration, SeparatorStyleConfig, DurationConfig } from './types';
export const CARD_VERSION = '2.4.0';

export const DEFAULT_SHOW: ShowConfiguration = {
  state: true,
  duration: true,
  start_date: true,
  end_date: true,
  icon: true,
  separator: false,
  entity_name: true,
};

export const DEFAULT_DURATION: DurationConfig = {
  largest: 1,
  labels: undefined,
  delimiter: undefined,
  units: ['w', 'd', 'h', 'm', 's'],
};

export const DEFAULT_SEPARATOR_STYLE: SeparatorStyleConfig = {
  width: 1,
  style: 'solid',
  color: 'var(--divider-color)',
};
