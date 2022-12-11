import { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';
import { UnitName } from 'humanize-duration-ts';

export interface LogbookCardConfig extends LovelaceCardConfig {
  type: string;
  title?: string;
  history?: number;
  desc?: boolean;
  entity?: string;
  no_event?: string;
  max_items?: number;
  attributes?: Array<AttributeConfig>;
  state_map?: Array<StateMap>;
  duration?: DurationConfig;
  hidden_state?: Array<string>;
  show?: ShowConfiguration;
  date_format?: string;
  separator_style?: SeparatorStyleConfig;
  collapse?: number;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface DurationConfig {
  largest?: number | 'full';
  labels?: DurationLabel | undefined;
  delimiter?: string;
  units?: Array<UnitName>;
}

export interface DurationLabel {
  month: string;
  week: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

export interface StateMap {
  value?: string;
  label?: string;
  icon?: string;
  icon_color: string | null;
  regexp?: RegExp;
}

export interface IconState {
  icon: string;
  color: string | null;
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
  icon: IconState;
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
