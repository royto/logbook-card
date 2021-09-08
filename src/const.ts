import { ShowConfiguration, DurationLabels, SeparatorStyleConfig } from './types';
export const CARD_VERSION = '1.4.1';

export const DEFAULT_SHOW: ShowConfiguration = {
  state: true,
  duration: true,
  start_date: true,
  end_date: true,
  icon: true,
  separator: false,
};

export const DEFAULT_DURATION_LABELS: DurationLabels = {
  second: '${value}s',
  seconds: '${value}s',
  minute: '${value}m',
  minutes: '${value}m',
  hour: '${value}h',
  hours: '${value}h',
  day: '${value}d',
  days: '${value}d',
};

export const DEFAULT_SEPARATOR_STYLE: SeparatorStyleConfig = {
  width: 1,
  style: 'solid',
  color: 'var(--divider-color)',
};
