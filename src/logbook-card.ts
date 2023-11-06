import { LogbookCardEditor } from './editor';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { html, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { hasConfigOrEntityChanged, LovelaceCardEditor, hasAction } from 'custom-card-helpers';

import './editor';
import './logbook-date';
import './logbook-duration';
import { LogbookCardConfig, History, ExtendedHomeAssistant, HistoryOrCustomLogEvent, CustomLogEvent } from './types';
import { DEFAULT_SHOW, DEFAULT_SEPARATOR_STYLE, DEFAULT_DURATION } from './const';
import { localize } from './localize/localize';
import { actionHandler } from './action-handler-directive';
import { EntityCustomLogConfig, getCustomLogsPromise } from './custom-logs';
import { EntityHistoryConfig, getHistory } from './history';
import { toHiddenRegex, toStateMapRegex } from './config-helpers';
import { LogbookBaseCard } from './logbook-base-card';
import { checkBaseConfig } from './config-validator';
import { addCustomCard } from './ha/custom-card';

addCustomCard('logbook-card', 'Logbook Card', 'A custom card to display entity history');

@customElement('logbook-card')
export class LogbookCard extends LogbookBaseCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('logbook-card-editor') as LogbookCardEditor;
  }

  public static getStubConfig(_hass: ExtendedHomeAssistant, entities: Array<any>): Record<string, unknown> {
    return {
      entity: entities[0],
    };
  }

  @state() private config!: LogbookCardConfig;
  @property({ type: Array }) private history: Array<HistoryOrCustomLogEvent> = [];

  private lastHistoryChanged?: Date;
  private MAX_UPDATE_DURATION = 5000;

  public setConfig(config: LogbookCardConfig): void {
    checkBaseConfig(config);

    if (!config.entity) {
      throw new Error(localize('logbook-card.missing_entity'));
    }
    if (config.hidden_state && !Array.isArray(config.hidden_state)) {
      throw new Error('hidden_state must be an array');
    }
    if (config.state_map && !Array.isArray(config.state_map)) {
      throw new Error('state_map must be an array');
    }
    if (config.attributes && !Array.isArray(config.attributes)) {
      throw new Error('attributes must be an array');
    }

    this.config = {
      history: 5,
      hidden_state: [],
      desc: true,
      max_items: -1,
      no_event: 'No event on the period',
      attributes: [],
      scroll: true,
      custom_logs: false,
      ...config,
      state_map: toStateMapRegex(config.state_map),
      hidden_state_regexp: toHiddenRegex(config.hidden_state),
      show: { ...DEFAULT_SHOW, ...config.show },
      duration: { ...DEFAULT_DURATION, ...config.duration },
      duration_labels: { ...config.duration_labels },
      separator_style: { ...DEFAULT_SEPARATOR_STYLE, ...config.separator_style },
    };
  }

  updateHistory(): void {
    const hass = this.hass;
    if (hass && this.config && this.config.entity) {
      const stateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;

      if (stateObj) {
        this.config.title = this.config?.title ?? stateObj.attributes.friendly_name + ' History';

        const startDate = new Date(new Date().setDate(new Date().getDate() - (this.config.history ?? 5)));
        const entityConfig: EntityHistoryConfig = {
          attributes: this.config.attributes,
          entity: this.config.entity,
          state_map: this.config.StateMap,
          hidden_state_regexp: this.config.hidden_state_regexp,
          date_format: this.config.date_format,
          minimal_duration: this.config.minimal_duration,
        };
        const historyPromise = getHistory(this.hass, entityConfig, startDate);

        const customLogConfig: EntityCustomLogConfig = {
          entity: this.config.entity!,
          custom_logs: this.config.custom_logs || false,
        };
        const customLogsPromise = getCustomLogsPromise(this.hass, customLogConfig, startDate);

        Promise.all([historyPromise, customLogsPromise]).then(([history, customLogs]) => {
          let historyAndCustomLogs = [...history, ...customLogs].sort((a, b) => a.start.valueOf() - b.start.valueOf());

          if (this.config?.desc) {
            historyAndCustomLogs = historyAndCustomLogs.reverse();
          }
          if (this.config && this.config.max_items && this.config.max_items > 0) {
            historyAndCustomLogs = historyAndCustomLogs.splice(0, this.config?.max_items);
          }

          this.history = historyAndCustomLogs;
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
    if (!this.config || !this.hass || !this.lastHistoryChanged) {
      return html``;
    }

    const contentCardClass = this.config.scroll ? 'card-content-scroll' : '';

    return html`
      <ha-card tabindex="0">
        <h1
          aria-label=${`${this.config.title}`}
          class="card-header"
          @action=${this._handleAction}
          .actionHandler=${actionHandler({
            hasHold: hasAction(this.config.hold_action),
            hasDoubleClick: hasAction(this.config.double_tap_action),
          })}
        >
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
      <div class="item custom-log">
        ${this.renderCustomLogIcon(customLogEvent.entity, this.config)}
        <div class="item-content">
          <span class="custom-log__name">${customLogEvent.name}</span> -
          <span class="custom-log__message">${customLogEvent.message}</span>
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
      <div class="item history">
        ${this.renderIcon(item, this.config)}
        <div class="item-content">
          ${this.config?.show?.state
            ? html`
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
