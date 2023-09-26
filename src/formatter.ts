import { format } from 'fecha';
import { html, TemplateResult } from 'lit';
import { HomeAssistant, formatDateTime } from 'custom-card-helpers';
import { HumanizeDuration, HumanizeDurationLanguage, HumanizeDurationOptions } from 'humanize-duration-ts';
import { DurationConfig, ExtendedHomeAssistant } from './types';
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

export const getDuration = (durationInMs: number, durationConfig: DurationConfig, hass: HomeAssistant): string => {
  if (!durationInMs) {
    return '';
  }

  const humanizeDuration = new HumanizeDuration(new HumanizeDurationLanguage());
  let language = humanizeDuration.getSupportedLanguages().includes(hass?.locale?.language ?? 'en')
    ? hass?.locale?.language //test if working (hass.language)
    : 'en';

  if (durationConfig?.labels) {
    humanizeDuration.addLanguage('custom', {
      y: () => 'y',
      mo: () => durationConfig?.labels?.month ?? 'mo',
      w: () => durationConfig.labels?.week ?? 'w',
      d: () => durationConfig.labels?.day ?? 'd',
      h: () => durationConfig.labels?.hour ?? 'h',
      m: () => durationConfig.labels?.minute ?? 'm',
      s: () => durationConfig.labels?.second ?? 's',
      ms: () => 'ms',
      decimal: '',
    });
    language = 'custom';
  }

  const humanizeDurationOptions: HumanizeDurationOptions = {
    language,
    units: durationConfig?.units,
    round: true,
  };

  if (durationConfig?.largest !== 'full') {
    humanizeDurationOptions['largest'] = durationConfig?.largest;
  }

  if (durationConfig.delimiter !== undefined) {
    humanizeDurationOptions['delimiter'] = durationConfig.delimiter;
  }
  //return durationInMs.toString();
  return humanizeDuration.humanize(durationInMs, humanizeDurationOptions);
};
