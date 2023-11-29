/* eslint-disable @typescript-eslint/no-explicit-any */

import { html, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './logbook-date';
import './logbook-duration';
import {
  History,
  ExtendedHomeAssistant,
  HistoryOrCustomLogEvent,
  CustomLogEvent,
  MultipleLogbookCardConfig,
} from './types';
import { DEFAULT_SHOW, DEFAULT_SEPARATOR_STYLE, DEFAULT_DURATION } from './const';
import { EntityCustomLogConfig, getCustomLogsPromise } from './custom-logs';
import { EntityHistoryConfig, getHistory } from './history';
import { toStateMapRegex, toHiddenRegex, toCustomLogMapRegex } from './config-helpers';
import { LogbookBaseCard } from './logbook-base-card';
import { checkBaseConfig } from './config-validator';
import { addCustomCard } from './ha/custom-card';
import { localize } from './localize/localize';

addCustomCard(
  'multiple-logbook-card',
  'Multiple entity Logbook Card',
  'A custom card to display history for multiple entities',
);

@customElement('multiple-logbook-card')
export class MultipleLogbookCard extends LogbookBaseCard {
  // Add any properties that should cause your element to re-render here
  @property({ type: Object }) public hass!: ExtendedHomeAssistant;
  @state() private config!: MultipleLogbookCardConfig;
  @state() private history: Array<HistoryOrCustomLogEvent> = [];

  constructor() {
    super();
    this.mode = 'multiple';
  }

  private lastHistoryChanged?: Date;

  public setConfig(config: MultipleLogbookCardConfig): void {
    checkBaseConfig(config);

    if (!config.entities && !Array.isArray(config.entities)) {
      throw new Error(localize('multiple_logbook_card.missing_entities'));
    }

    if (config.entities.length === 0) {
      throw new Error(localize('multiple_logbook_card.missing_entities'));
    }

    //Check for attributes / states / hidden_state

    this.config = {
      history: 5,
      desc: true,
      max_items: -1,
      no_event: localize('common.default_no_event'),
      attributes: [],
      scroll: true,
      custom_logs: false,
      show_history: true,
      ...config,
      entities: config.entities?.map(e => ({
        attributes: e.attributes ?? [],
        entity: e.entity,
        state_map: toStateMapRegex(e.state_map),
        hidden_state: e.hidden_state,
        custom_logs: e.custom_logs,
        label: e.label,
        custom_log_map: e.custom_log_map,
      })),
      show: { ...DEFAULT_SHOW, ...config.show },
      duration: { ...DEFAULT_DURATION, ...config.duration },
      duration_labels: { ...config.duration_labels },
      separator_style: { ...DEFAULT_SEPARATOR_STYLE, ...config.separator_style },
    };
  }

  updateHistory(): void {
    const hass = this.hass;

    if (hass && this.config && this.config.entities) {
      const existingEntities = this.config.entities.filter(
        entity => !!entity.entity && !!this.hass.states[entity.entity],
      );

      if (existingEntities.length > 0) {
        const startDate = new Date(new Date().setDate(new Date().getDate() - (this.config.history ?? 5)));

        const historyPromises = new Array<Promise<History[]>>();
        const customLogsPromises = new Array<Promise<CustomLogEvent[]>>();
        for (const entity of existingEntities) {
          const entityConfig: EntityHistoryConfig = {
            attributes: entity.attributes,
            entity: entity.entity!,
            entity_name: entity.label,
            hidden_state_regexp: toHiddenRegex(entity.hidden_state),
            state_map: entity.state_map,
            date_format: this.config.date_format,
            minimal_duration: this.config.minimal_duration,
            show_history: this.config.show_history,
          };
          const promise = getHistory(this.hass, entityConfig, startDate);
          historyPromises.push(promise);

          const customLogConfig: EntityCustomLogConfig = {
            entity: entity.entity!,
            entity_name: entity.label ?? this.hass.states[entity.entity!].attributes.friendly_name,
            custom_logs: entity.custom_logs === true || false,
            log_map: toCustomLogMapRegex(entity.custom_log_map),
          };
          const customLogsPromise = getCustomLogsPromise(this.hass, customLogConfig, startDate);
          customLogsPromises.push(customLogsPromise);
        }

        Promise.all([...historyPromises, ...customLogsPromises]).then(history => {
          let allHistory = history.flat().sort((a, b) => a.start.valueOf() - b.start.valueOf());

          if (this.config?.desc) {
            allHistory = allHistory.reverse();
          }
          if (this.config && this.config.max_items && this.config.max_items > 0) {
            allHistory = allHistory.splice(0, this.config?.max_items);
          }

          this.history = allHistory;

          this.lastHistoryChanged = new Date();
        });
      }
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('history')) {
      return true;
    }
    changedProps.delete('history');
    return false;
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass || !this.lastHistoryChanged) {
      return html``;
    }

    const contentCardClass = this.config.scroll ? 'card-content-scroll' : '';

    return html`
      <ha-card tabindex="0">
        <h1 aria-label=${`${this.config.title}`} class="card-header">
          ${this.config.title}
        </h1>
        <div class="card-content ${contentCardClass} grid" style="[[contentStyle]]">
          ${this.renderHistory(this.history, this.config)}
        </div>
      </ha-card>
    `;
  }
}
