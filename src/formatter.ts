import { format } from 'fecha';
import { html, TemplateResult } from 'lit';
import { formatDateTime } from 'custom-card-helpers';
import { ExtendedHomeAssistant } from './types';
import { HassEntity } from 'home-assistant-js-websocket/dist/types';

export const displayDate = (
  hass: ExtendedHomeAssistant,
  date: Date,
  dateFormat: string | 'relative' | undefined,
): string | TemplateResult => {
  if (dateFormat === 'relative') {
    return html`
      <ha-relative-time .hass=${hass} .datetime=${date}></ha-relative-time>
    `;
  }
  if (dateFormat) {
    return format(date, dateFormat ?? undefined);
  }
  return formatDateTime(date, hass.locale!);
};

export const formatAttributeValue = (
  hass: ExtendedHomeAssistant,
  value: any,
  type: 'date' | string | undefined,
  dateFormat: string | 'relative' | undefined,
): string | TemplateResult => {
  if (type === 'date') {
    return displayDate(hass, new Date(value), dateFormat);
  }
  return value;
};

export const formatEntityAttributeValue = (
  hass: ExtendedHomeAssistant,
  entity: HassEntity,
  attribute: string,
  value: any,
  type: string | undefined,
  dateFormat: string | 'relative' | undefined,
): string | TemplateResult => {
  if (type === 'date') {
    return displayDate(hass, new Date(value), dateFormat);
  }
  if (hass.formatEntityAttributeValue) {
    return hass.formatEntityAttributeValue(entity, attribute);
  }
  return value;
};
