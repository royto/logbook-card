import { CSSResultGroup, LitElement, TemplateResult, css, html } from 'lit';
import {
  CustomLogEvent,
  ExtendedHomeAssistant,
  LogbookCardConfigBase,
  Attribute,
  History,
  HistoryOrCustomLogEvent,
} from './types';
import { property } from 'lit/decorators.js';
import { handleAction, ActionHandlerEvent, hasAction } from 'custom-card-helpers';
import { actionHandler } from './action-handler-directive';
import { styleMap, StyleInfo } from 'lit/directives/style-map.js';
import { isSameDay } from './date-helpers';
import { HassEntity } from 'home-assistant-js-websocket/dist/types';

export abstract class LogbookBaseCard extends LitElement {
  @property({ attribute: false }) public hass!: ExtendedHomeAssistant;

  protected mode: 'multiple' | 'single' = 'single';
  private updateHistoryIntervalId: NodeJS.Timeout | null = null;
  private UPDATE_INTERVAL = 5000;

  protected _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && ev.detail.action && !!ev.target && ev.target['entity']) {
      handleAction(this, this.hass, { entity: ev.target['entity'] }, ev.detail.action);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.updateHistoryIntervalId = setInterval(() => this.updateHistory(), this.UPDATE_INTERVAL);
    setTimeout(() => this.updateHistory(), 1);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.updateHistoryIntervalId !== null) {
      clearInterval(this.updateHistoryIntervalId);
    }
  }

  abstract updateHistory(): void;

  renderHistory(items: HistoryOrCustomLogEvent[] | undefined, config: LogbookCardConfigBase): TemplateResult {
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
        ${this.renderHistoryItems(items.slice(0, config.collapse), undefined, config)}
        <input type="checkbox" class="expand" id="${elemId}" />
        <label for="${elemId}"><div>&lsaquo;</div></label>
        <div>
          ${this.renderHistoryItems(items.slice(config.collapse), items[config.collapse], config)}
        </div>
      `;
    } else {
      return this.renderHistoryItems(items, undefined, config);
    }
  }

  protected renderHistoryItems(
    items: HistoryOrCustomLogEvent[],
    previousItem: HistoryOrCustomLogEvent | undefined,
    config: LogbookCardConfigBase,
  ): TemplateResult {
    return html`
      ${items?.map((item, index, array) => {
        const isLast = index + 1 === array.length;
        const shouldRenderDaySeparator = this.shouldRenderDaySeparator(items, previousItem, index);
        if (item.type === 'history') {
          return html`
            ${shouldRenderDaySeparator ? this.renderDaySeparator(item, config) : ``}
            ${this.renderHistoryItem(item, isLast, config)}
          `;
        }
        return html`
          ${shouldRenderDaySeparator ? this.renderDaySeparator(item, config) : ``}
          ${this.renderCustomLogEvent(item, isLast, config)}
        `;
      })}
    `;
  }

  protected shouldRenderDaySeparator(
    items: HistoryOrCustomLogEvent[],
    previousItem: HistoryOrCustomLogEvent | undefined,
    index: number,
  ): boolean {
    const item = items[index];
    return (
      (previousItem === undefined && index === 0) ||
      (previousItem !== undefined && index === 0 && !isSameDay(item.start, previousItem.start)) ||
      (index > 0 && !isSameDay(item.start, items[index - 1].start))
    );
  }

  protected renderHistoryItem(item: History, isLast: boolean, config: LogbookCardConfigBase): TemplateResult {
    return html`
      <div class="item history">
        ${this.renderHistoryIcon(item, config)}
        <div class="item-content">
          ${this.mode === 'multiple' && config.show?.entity_name
            ? this.renderEntity(item.stateObj.entity_id, item.entity_name, config)
            : ''}
          ${config?.show?.state
            ? html`
                <span class="state">${item.label}</span>
              `
            : html``}
          ${config?.show?.duration
            ? html`
                <span class="duration">
                  <logbook-duration .hass="${this.hass}" .config="${config}" .duration="${item.duration}">
                  </logbook-duration>
                </span>
              `
            : html``}
          ${this.renderHistoryDate(item, config)}${item.attributes?.map(this.renderAttributes)}
        </div>
      </div>
      ${!isLast ? this.renderSeparator(config) : ``}
    `;
  }

  protected renderCustomLogEvent(
    customLogEvent: CustomLogEvent,
    isLast: boolean,
    config: LogbookCardConfigBase,
  ): TemplateResult {
    return html`
      <div class="item custom-log">
        ${this.renderCustomLogIcon(customLogEvent, config)}
        <div class="item-content">
          ${this.mode === 'multiple' && config.show?.entity_name
            ? this.renderEntity(customLogEvent.entity, customLogEvent.entity_name, config)
            : ''}
          <span class="custom-log__name">${customLogEvent.name}</span>
          <span class="custom-log__separator">-</span>
          <span class="custom-log__message">${customLogEvent.message}</span>
          <div class="date">
            <logbook-date .hass=${this.hass} .date=${customLogEvent.start} .config=${config}></logbook-date>
          </div>
        </div>
      </div>
      ${!isLast ? this.renderSeparator(config) : ``}
    `;
  }

  protected renderCustomLogIcon(customLog: CustomLogEvent, config: LogbookCardConfigBase): TemplateResult | void {
    if (config?.show?.icon) {
      const state = this.hass.states[customLog.entity] as HassEntity;
      return this.renderIcon(state, customLog.icon, customLog.icon_color);
    }
  }

  protected renderHistoryIcon(item: History, config: LogbookCardConfigBase): TemplateResult | void {
    if (config?.show?.icon) {
      return this.renderIcon(item.stateObj, item.icon?.icon, item.icon?.color);
    }
  }

  private renderIcon(state: HassEntity, icon: string | undefined, color: string | undefined): TemplateResult {
    return html`
      <div class="item-icon">
        <state-badge .hass=${this.hass} .stateObj=${state} .overrideIcon=${icon} .color=${color} .stateColor=${true}>
        </state-badge>
      </div>
    `;
  }

  protected renderDaySeparator(item: CustomLogEvent | History, config: LogbookCardConfigBase): TemplateResult {
    if (!config.group_by_day) {
      return html``;
    }
    return html`
      <div class="date-separator">
        ${new Intl.DateTimeFormat(this.hass.locale?.language ?? 'en', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(item.start)}
      </div>
    `;
  }

  protected renderSeparator(config: LogbookCardConfigBase): TemplateResult | void {
    const style: StyleInfo = {
      border: '0',
      'border-top': `${config?.separator_style?.width}px ${config?.separator_style?.style} ${config?.separator_style?.color}`,
    };
    if (config?.show?.separator) {
      return html`
        <hr class="separator" style=${styleMap(style)} aria-hidden="true" />
      `;
    }
  }

  protected renderEntity(entity: string, name: string, config: LogbookCardConfigBase): TemplateResult {
    return html`
      <span
        class="entity"
        .entity=${entity}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
        })}
        >${name}</span
      >
    `;
  }

  protected renderAttributes(attribute: Attribute): TemplateResult {
    return html`
      <div class="attribute">
        <div class="key">${attribute.name}</div>
        <div class="value">${attribute.value}</div>
      </div>
    `;
  }

  renderHistoryDate(item: History, config: LogbookCardConfigBase): TemplateResult {
    if (config?.show?.start_date && config?.show?.end_date) {
      return html`
        <div class="date">
          <logbook-date .hass=${this.hass} .date=${item.start} .config=${config}></logbook-date> -
          <logbook-date .hass=${this.hass} .date=${item.end} .config=${config}></logbook-date>
        </div>
      `;
    }
    if (config?.show?.end_date) {
      return html`
        <div class="date">
          <logbook-date .hass=${this.hass} .date=${item.end} .config=${config}></logbook-date>
        </div>
      `;
    }
    if (config?.show?.start_date) {
      return html`
        <div class="date">
          <logbook-date .hass=${this.hass} .date=${item.start} .config=${config}></logbook-date>
        </div>
      `;
    }
    return html``;
  }

  static get styles(): CSSResultGroup {
    return css`
      .copy {
        user-select: text;
        background-color: red;
      }
      ha-card {
        overflow: clip;
      }
      .card-content-scroll {
        max-height: 345px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-gutter: stable;
      }
      .item {
        clear: both;
        padding: 5px 0;
        display: flex;
        line-height: var(--paper-font-body1_-_line-height);
      }
      .item-content {
        flex: 1;
      }
      .item-icon {
        flex: 0 0 4rem;
        color: var(--paper-item-icon-color, #44739e);
        display: flex;
        justify-content: center;
      }
      .entity {
        color: var(--paper-item-icon-color);
        cursor: pointer;
      }
      state-badge {
        line-height: 1.5rem;
      }
      state-badge[icon] {
        height: fit-content;
      }
      .state {
        white-space: pre-wrap;
      }
      .duration {
        font-size: 0.85rem;
        font-style: italic;
        float: right;
      }
      .date,
      .attribute {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
      }
      .attribute {
        display: flex;
        justify-content: space-between;
      }
      .expand {
        display: none;
      }
      .expand + label {
        display: block;
        text-align: right;
        cursor: pointer;
      }
      .expand + label > div {
        display: inline-block;
        transform: rotate(-90deg);
        font-size: 26px;
        height: 29px;
        width: 29px;
        text-align: center;
      }
      .expand + label > div,
      .expand + label + div {
        transition: 0.5s ease-in-out;
      }
      .expand:checked + label > div {
        transform: rotate(-90deg) scaleX(-1);
      }
      .expand + label + div {
        display: none;
        overflow: hidden;
      }
      .expand:checked + label + div {
        display: block;
      }
      .date-separator {
        display: block;
        border-block-end: 1px solid var(--divider-color);
        padding: 0.5rem 1rem;
        font-weight: bold;
        margin-block-end: 1rem;
      }
    `;
  }
}
