/*TODO
 - entity name: is it ok ? option to hide it ?
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

import { html, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { hasConfigOrEntityChanged } from 'custom-card-helpers';

import './logbook-date';
import './logbook-duration';
import {
  LogbookCardConfig,
  History,
  ExtendedHomeAssistant,
  HistoryOrCustomLogEvent,
  CustomLogEvent,
  MultipleLogbookCardConfig,
} from './types';
import { DEFAULT_SHOW, DEFAULT_SEPARATOR_STYLE, DEFAULT_DURATION } from './const';
import { EntityCustomLogConfig, getCustomLogsPromise } from './custom-logs';
import { EntityHistoryConfig, getHistory } from './history';
import { toStateMapRegex, toHiddenRegex } from './config-helpers';
import { LogbookBaseCard } from './logbook-base-card';
import { checkBaseConfig } from './config-validator';
import { addCustomCard } from './ha/custom-card';

addCustomCard(
  'multiple-logbook-card',
  'Multiple entity Logbook Card',
  'A custom card to display history for multiple entities',
);

console.log('MULTIPLE 1.0.7');

@customElement('multiple-logbook-card')
export class MultipleLogbookCard extends LogbookBaseCard {
  // Add any properties that should cause your element to re-render here
  @property({ type: Object }) public hass!: ExtendedHomeAssistant;
  @state() private config!: MultipleLogbookCardConfig;
  @property({ type: Array }) private history: Array<HistoryOrCustomLogEvent> = [];

  private lastHistoryChanged?: Date;
  private MAX_UPDATE_DURATION = 5000;

  public setConfig(config: MultipleLogbookCardConfig): void {
    checkBaseConfig(config);

    if (!config.entities && !Array.isArray(config.entities)) {
      throw new Error('Please define at least an entity.');
    }

    if (config.entities.length === 0) {
      throw new Error('Please define at least an entity.');
    }

    //Check for attributes / states / hidden_state

    this.config = {
      history: 5,
      desc: true,
      max_items: -1,
      no_event: 'No event on the period',
      attributes: [],
      scroll: true,
      custom_logs: false,
      ...config,
      entities: config.entities?.map(e => ({
        attributes: e.attributes ?? [],
        entity: e.entity,
        state_map: toStateMapRegex(e.state_map),
        hidden_state: e.hidden_state,
        custom_logs: e.custom_logs,
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
            hidden_state_regexp: toHiddenRegex(entity.hidden_state),
            state_map: entity.state_map,
            date_format: this.config.date_format,
            minimal_duration: this.config.minimal_duration,
          };
          const promise = getHistory(this.hass, entityConfig, startDate);
          historyPromises.push(promise);

          const customLogConfig: EntityCustomLogConfig = {
            entity: entity.entity!,
            custom_logs: entity.custom_logs || false,
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
        });
      }

      this.lastHistoryChanged = new Date();
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('history')) {
      return true;
    }
    changedProps.delete('history');
    if (
      !this.lastHistoryChanged ||
      hasConfigOrEntityChanged(this, changedProps, false) ||
      //refresh only every 5s.
      new Date().getTime() - this.lastHistoryChanged.getTime() > this.MAX_UPDATE_DURATION
    ) {
      this.updateHistory();
    }
    return false;
  }

  protected render(): TemplateResult | void {
    //TODO Render errors
    // Missing entities ...
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

  renderHistory(items: HistoryOrCustomLogEvent[] | undefined, config: LogbookCardConfig): TemplateResult {
    if (!items || items?.length === 0) {
      return html`
        <p>
          ${config.no_event}
        </p>
      `;
    }

    if (config.collapse && items.length > config.collapse) {
      const elemId = `expander${Math.random()
        .toString(10)
        .substring(2)}`;
      return html`
        ${this.renderHistoryItems(items.slice(0, config.collapse))}
        <input type="checkbox" class="expand" id="${elemId}" />
        <label for="${elemId}"><div>&lsaquo;</div></label>
        <div>
          ${this.renderHistoryItems(items.slice(config.collapse))}
        </div>
      `;
    } else {
      return this.renderHistoryItems(items);
    }
  }

  renderHistoryItems(items: HistoryOrCustomLogEvent[]): TemplateResult {
    return html`
      ${items?.map((item, index, array) => {
        const isLast = index + 1 === array.length;
        if (item.type === 'history') {
          return this.renderHistoryItem(item, isLast);
        }
        return this.renderCustomLogEvent(item, isLast);
      })}
    `;
  }

  renderCustomLogEvent(customLogEvent: CustomLogEvent, isLast: boolean): TemplateResult {
    return html`
      <div class="item">
        ${this.renderCustomLogIcon(customLogEvent.entity, this.config)}
        <div class="item-content">
          ${this.renderEntity(customLogEvent.entity, this.config)} - ${customLogEvent.name} - ${customLogEvent.message}
          <div class="date">
            <logbook-date .hass=${this.hass} .date=${customLogEvent.start} .config=${this.config}></logbook-date>
          </div>
        </div>
      </div>
      ${!isLast ? this.renderSeparator(this.config) : ``}
    `;
  }

  renderHistoryItem(item: History, isLast: boolean): TemplateResult {
    return html`
      <div class="item">
        ${this.renderIcon(item, this.config)}
        <div class="item-content">
          ${this.config?.show?.state
            ? html`
                ${this.renderEntity(item.stateObj.entity_id, this.config)} -
                <span class="state">${item.label}</span>
              `
            : html``}
          ${this.config?.show?.duration
            ? html`
                <span class="duration">
                  <logbook-duration .hass="${this.hass}" .config="${this.config}" .duration="${item.duration}">
                  </logbook-duration>
                </span>
              `
            : html``}
          ${this.renderHistoryDate(item, this.config)}${item.attributes?.map(this.renderAttributes)}
        </div>
      </div>
      ${!isLast ? this.renderSeparator(this.config) : ``}
    `;
  }
}
