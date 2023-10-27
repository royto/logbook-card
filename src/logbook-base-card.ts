import { CSSResultGroup, LitElement, TemplateResult, css, html } from 'lit';
import { CustomLogEvent, ExtendedHomeAssistant, LogbookCardConfigBase, Attribute, History } from './types';
import { property } from 'lit/decorators.js';
import { handleAction, ActionHandlerEvent, hasAction } from 'custom-card-helpers';
import { actionHandler } from './action-handler-directive';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';

export class LogbookBaseCard extends LitElement {
  @property({ attribute: false }) public hass!: ExtendedHomeAssistant;

  protected _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && ev.detail.action && !!ev.target && ev.target['entity']) {
      handleAction(this, this.hass, { entity: ev.target['entity'] }, ev.detail.action);
    }
  }

  protected renderCustomLogEvent(
    customLogEvent: CustomLogEvent,
    isLast: boolean,
    config: LogbookCardConfigBase,
  ): TemplateResult {
    return html`
      <div class="item">
        ${this.renderCustomLogIcon(customLogEvent.entity, config)}
        <div class="item-content">
          ${this.renderEntity(customLogEvent.entity, config)} - ${customLogEvent.name} - ${customLogEvent.message}
          <div class="date">
            <logbook-date .hass=${this.hass} .date=${customLogEvent.start} .config=${config}></logbook-date>
          </div>
        </div>
      </div>
      ${!isLast ? this.renderSeparator(config) : ``}
    `;
  }

  protected renderCustomLogIcon(entity: string, config: LogbookCardConfigBase): TemplateResult | void {
    if (config?.show?.icon) {
      const state = this.hass.states[entity];
      return html`
        <div class="item-icon">
          <state-badge .stateObj=${state} .stateColor=${false}></state-badge>
        </div>
      `;
    }
  }

  protected renderSeparator(config: LogbookCardConfigBase): TemplateResult | void {
    const style: StyleInfo = {
      border: '0',
      'border-top': `${config?.separator_style?.width}px ${config?.separator_style?.style} ${config?.separator_style?.color}`,
    };
    if (config?.show?.separator) {
      return html`
        <hr style=${styleMap(style)} aria-hidden="true" />
      `;
    }
  }

  protected renderEntity(entity: string, config: LogbookCardConfigBase): TemplateResult {
    return html`
      <span
        class="entity"
        .entity=${entity}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
        })}
        >${this.hass.states[entity].attributes.friendly_name}</span
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

  protected renderIcon(item: History, config: LogbookCardConfigBase): TemplateResult | void {
    if (config?.show?.icon) {
      if (item.icon !== null) {
        return html`
          <div class="item-icon">
            <ha-icon .icon=${item.icon.icon} style=${item.icon.color ? `color: ${item.icon.color}` : ``}></ha-icon>
          </div>
        `;
      }
      return html`
        <div class="item-icon">
          <state-badge .stateObj=${item.stateObj} .stateColor=${true}></state-badge>
        </div>
      `;
    }
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
    `;
  }
}
