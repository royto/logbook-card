import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { ActionConfig, LovelaceCardConfig, HomeAssistant } from 'custom-card-helpers';
import { UnitName } from 'humanize-duration-ts';
import { TemplateResult } from 'lit';

export interface ExtendedHomeAssistant extends HomeAssistant {
  formatEntityState(stateObj: HassEntity, state?: string): string;
  formatEntityAttributeValue(stateObj: HassEntity, attribute: string, value?: string): string;
  formatEntityAttributeName(stateObj: HassEntity, attribute: string): string;
}

export interface LogbookCardConfigBase extends LovelaceCardConfig {
  title?: string;
  history?: number;
  hours_to_show?: number;
  collapse?: number;
  date_format?: string | 'relative';
  desc?: boolean;
  duration?: DurationConfig;
  group_by_day?: boolean;
  max_items?: number;
  minimal_duration?: number;
  no_event?: string;
  show?: ShowConfiguration;
  scroll?: boolean;
  separator_style?: SeparatorStyleConfig;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface EntityCardConfig {
  entity?: string;
  label?: string;
  attributes?: Array<AttributeConfig>;
  state_map?: Array<StateMap>;
  hidden_state?: Array<string | HiddenConfig>;
  custom_logs?: boolean;
  custom_log_map?: Array<CustomLogMapConfig>;
  show_history?: boolean;
}

export interface LogbookCardConfig extends LogbookCardConfigBase, EntityCardConfig {}

export interface MultipleLogbookCardConfig extends LogbookCardConfigBase {
  entities?: EntityCardConfig[];
}

export interface HiddenConfig {
  state?: string;
  attribute?: AttributeHiddenConfig;
}

interface AttributeHiddenConfig {
  name: string;
  value: string;
  hideIfMissing?: boolean;
}

export interface HiddenRegExp {
  state?: RegExp;
  attribute?: AttributeHiddenRegExp;
}

interface AttributeHiddenRegExp {
  name: string;
  value: RegExp;
  hideIfMissing: boolean;
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
  icon_color?: string;
  regexp?: RegExp;
}

export interface CustomLogMapConfig {
  name?: string;
  message?: string;
  icon?: string;
  icon_color?: string;
  hidden?: boolean;
}

export interface IconState {
  icon: string;
  color?: string;
}

export interface ShowConfiguration {
  state: boolean;
  duration: boolean;
  start_date: boolean;
  end_date: boolean;
  icon: boolean;
  separator: boolean;
  entity_name: true;
}

export interface AttributeConfig {
  value: string;
  label?: string;
  type?: 'date' | 'url';
  link_label?: string;
}

export interface History {
  type: 'history';
  stateObj: HassEntity;
  entity_name: string;
  state: string;
  label: string;
  start: Date;
  end: Date;
  attributes: Array<Attribute>;
  duration: number;
  icon: IconState;
}

export interface CustomLogEvent {
  type: 'customLog';
  entity_name: string;
  entity: string;
  start: Date;
  name: string;
  message: string;
  icon?: string; // ?
  icon_color?: string;
}

export type HistoryOrCustomLogEvent = History | CustomLogEvent;
export interface Attribute {
  value: string | TemplateResult;
  name: string;
}

export interface SeparatorStyleConfig {
  width: number;
  style: string;
  color: string;
}
