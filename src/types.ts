import { ActionConfig } from 'custom-card-helpers';

// TODO Add your configuration elements here for type-checking
export interface LogbookCardConfig {
  type: string;
  title?: string;
  history: number;
  desc?: boolean;
  entity?: string;
  no_event?: string;
  max_items: number;
  attributes: Array<AttributeConfig>;
  state_map?: Array<StateMap>;
  duration_labels: DurationLabels;
  hiddenState: Array<string>;
  show?: ShowConfiguration;
  date_format?: string;
  separator_style?: SeparatorStyleConfig;

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface DurationLabels {
  second: string;
  seconds: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
}

export interface StateMap {
  value?: string;
  label?: string;
  icon?: string;
}

export interface ShowConfiguration {
  state: boolean;
  duration: boolean;
  start_date: boolean;
  end_date: boolean;
  icon: boolean;
  separator: boolean;
}

export interface AttributeConfig {
  value: string;
  label?: string;
  type?: string;
}

export interface History {
  state: string;
  label: string;
  start: Date;
  end: Date;
  attributes: Array<Attribute>;
  duration: number;
  icon: string;
}

export interface Attribute {
  value: string;
  name: string;
}

export interface SeparatorStyleConfig {
  width: number;
  style: string;
  color: string;
}
