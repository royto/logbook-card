import { LogbookCardEditor } from './editor';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { styleMap, StyleInfo } from 'lit-html/directives/style-map';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  stateIcon,
  formatDateTime,
  computeStateDisplay,
  LovelaceCardEditor,
  handleAction,
  ActionHandlerEvent,
  hasAction,
} from 'custom-card-helpers';

import './editor';

import { HumanizeDurationLanguage, HumanizeDuration, HumanizeDurationOptions } from 'humanize-duration-ts';

import { format } from 'fecha';

import { LogbookCardConfig, History, Attribute, AttributeConfig, IconState } from './types';
import { CARD_VERSION, DEFAULT_SHOW, DEFAULT_SEPARATOR_STYLE, DEFAULT_DURATION } from './const';
import { localize } from './localize/localize';
import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { actionHandler } from './action-handler-directive';

/* eslint no-console: 0 */
console.info(
  `%c LOGBOOK-CARD %c ${CARD_VERSION} `,
  'color: orange; font-weight: bold; background: black',
  'color: darkblue; font-weight: bold; background: white',
);

// Puts card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'logbook-card',
  name: 'Logbook Card',
  preview: true,
  description: 'A custom card to display entity history',
});

@customElement('logbook-card')
export class LogbookCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('logbook-card-editor') as LogbookCardEditor;
  }

  public static getStubConfig(_hass: HomeAssistant, entities: Array<any>): Record<string, unknown> {
    return {
      entity: entities[0],
    };
  }

  // Add any properties that should cause your element to re-render here
  @property() public hass!: HomeAssistant;
  @state() private config!: LogbookCardConfig;
  @property() private history?: Array<History>;

  private lastHistoryChanged?: Date;
  private MAX_UPDATE_DURATION = 5000;
  private hiddenStateRegexp: Array<RegExp> = new Array<RegExp>();

  public setConfig(config: LogbookCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }
    if (!config.entity) {
      throw new Error('Please define an entity.');
    }
    if (config.max_items !== undefined && !Number.isInteger(config.max_items)) {
      throw new Error('max_items must be an Integer.');
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
    if (config.desc && typeof config.desc !== 'boolean') {
      throw new Error('desc must be a boolean');
    }
    if (config.collapse && !Number.isInteger(config.collapse)) {
      throw new Error('collapse must be a number');
    }
    if (config.collapse && config.max_items && config.collapse > config.max_items) {
      throw new Error('collapse must be greater than max-items');
    }
    if (config.duration?.units && !Array.isArray(config.duration.units)) {
      throw new Error('duration.units must be an array');
    }
    if (config.duration?.largest && !Number.isInteger(config.duration.largest) && config.duration.largest !== 'full') {
      throw new Error('duration.largest should be a number or `full`');
    }

    this.config = {
      history: 5,
      hidden_state: [],
      desc: true,
      max_items: -1,
      no_event: 'No event on the period',
      attributes: [],
      ...config,
      state_map:
        config.state_map?.map(state => {
          return {
            ...state,
            regexp: this.wildcardToRegExp(state.value ?? ''),
          };
        }) ?? [],
      show: { ...DEFAULT_SHOW, ...config.show },
      duration: { ...DEFAULT_DURATION, ...config.duration },
      duration_labels: { ...config.duration_labels },
      separator_style: { ...DEFAULT_SEPARATOR_STYLE, ...config.separator_style },
    };

    if (this.config.hidden_state) {
      this.hiddenStateRegexp = this.config.hidden_state.map(hs => this.wildcardToRegExp(hs));
    }
  }

  mapState(entity: HassEntity): string {
    const s = this.config?.state_map?.find(s => s.regexp?.test(entity.state));
    return s !== undefined && s.label
      ? s.label
      : this.hass
      ? computeStateDisplay(this.hass.localize, entity, this.hass.locale!)
      : entity.state;
  }

  mapIcon(item: HassEntity): IconState {
    const s = this.config?.state_map?.find(s => s.regexp?.test(item.state));
    const iconSvg = s !== undefined && s.icon ? s.icon : stateIcon(item);

    return { icon: iconSvg, color: s?.icon_color || null };
  }

  // From https://gist.github.com/donmccurdy/6d073ce2c6f3951312dfa45da14a420f by donmccurdy
  /**
   * Creates a RegExp from the given string, converting asterisks to .* expressions,
   * and escaping all other characters.
   */
  wildcardToRegExp(s: string): RegExp {
    return new RegExp(
      '^' +
        s
          .split(/\*+/)
          .map(x => this.regExpEscape(x))
          .join('.*') +
        '$',
    );
  }

  /**
   * RegExp-escapes all characters in the given string.
   */
  regExpEscape(s: string): string {
    return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  }

  squashSameState(array: Array<History>, val: History): Array<History> {
    const prev = array[array.length - 1];
    if (!prev || (prev.state !== val.state && val.state !== 'unknown')) {
      array.push(val);
    } else {
      prev.end = val.end;
      prev.duration += val.duration;
    }
    return array;
  }

  extractAttributes(item: any): Array<Attribute> {
    if (this.config?.attributes == null) {
      return [];
    }

    return this.config?.attributes.reduce((p: Array<Attribute>, c: AttributeConfig): Array<Attribute> => {
      if (item.attributes[c.value]) {
        const attribute = item.attributes[c.value];
        if (typeof attribute === 'object' && !Array.isArray(attribute)) {
          const keys = Object.keys(attribute);
          keys.forEach(key => {
            p.push({
              name: key,
              value: this.formatAttributeValue(attribute[key], undefined),
            });
          });
        } else if (Array.isArray(attribute)) {
          p.push({
            name: c.label ? c.label : c.value,
            value: this.formatAttributeValue(attribute.join(','), undefined),
          });
        } else {
          p.push({
            name: c.label ? c.label : c.value,
            value: this.formatAttributeValue(attribute, c.type),
          });
        }
      }
      return p;
    }, []);
  }

  getDuration(durationInMs: number): string {
    if (!durationInMs) {
      return '';
    }

    const humanizeDuration = new HumanizeDuration(new HumanizeDurationLanguage());
    let language = humanizeDuration.getSupportedLanguages().includes(this.hass?.language ?? 'en')
      ? this.hass?.language
      : 'en';

    if (this.config?.duration?.labels) {
      humanizeDuration.addLanguage('custom', {
        y: () => 'y',
        mo: () => this.config?.duration?.labels?.month ?? 'mo',
        w: () => this.config?.duration?.labels?.week ?? 'w',
        d: () => this.config?.duration?.labels?.day ?? 'd',
        h: () => this.config?.duration?.labels?.hour ?? 'h',
        m: () => this.config?.duration?.labels?.minute ?? 'm',
        s: () => this.config?.duration?.labels?.second ?? 's',
        ms: () => 'ms',
        decimal: '',
      });
      language = 'custom';
    }

    const humanizeDurationOptions: HumanizeDurationOptions = {
      language,
      units: this.config?.duration?.units,
      round: true,
    };

    if (this.config?.duration?.largest !== 'full') {
      humanizeDurationOptions['largest'] = this.config?.duration?.largest;
    }

    if (this.config?.duration?.delimiter !== undefined) {
      humanizeDurationOptions['delimiter'] = this.config.duration.delimiter;
    }

    return humanizeDuration.humanize(durationInMs, humanizeDurationOptions);
  }

  formatAttributeValue(value: any, type: string | undefined): string {
    if (type === 'date') {
      return this._displayDate(new Date(value));
    }
    return value;
  }

  _displayDate(date: Date): string {
    if (this.config?.date_format) {
      return format(date, this.config?.date_format ?? undefined);
    }
    return formatDateTime(date, this.hass.locale!);
  }

  updateHistory(): void {
    const hass = this.hass;
    if (hass && this.config && this.config.entity) {
      const stateObj = this.config.entity in hass.states ? hass.states[this.config.entity] : null;

      if (stateObj) {
        this.config.title = this.config?.title ?? stateObj.attributes.friendly_name + ' History';

        const startDate = new Date(new Date().setDate(new Date().getDate() - (this.config.history ?? 5)));

        const uri =
          'history/period/' +
          startDate.toISOString() +
          '?filter_entity_id=' +
          this.config.entity +
          '&end_time=' +
          new Date().toISOString();

        let historyTemp: Array<History> = [];

        //TODO Convert to async await ?
        hass.callApi('GET', uri).then((history: any) => {
          historyTemp = (history[0] || []) //empty if no history
            .map(h => ({
              state: h.state,
              label: this.mapState(h),
              start: new Date(h.last_changed),
              attributes: this.extractAttributes(h),
              icon: this.mapIcon(h),
            }))
            .map((x, i, arr) => {
              if (i < arr.length - 1) {
                return {
                  ...x,
                  end: arr[i + 1].start,
                };
              }
              return { ...x, end: new Date() };
            })
            .map(x => ({
              ...x,
              duration: x.end - x.start,
            }))
            //squash same state or unknown with previous state
            .reduce(this.squashSameState, [])
            .filter(x => !this.hiddenStateRegexp.some(regexp => regexp.test(x.state)))
            .map(x => ({
              ...x,
              duration: this.getDuration(x.duration),
            }));

          if (historyTemp && this.config?.desc) {
            historyTemp = historyTemp.reverse();
          }
          if (historyTemp && this.config && this.config.max_items && this.config.max_items > 0) {
            historyTemp = historyTemp.splice(0, this.config?.max_items);
          }
          this.history = historyTemp;
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

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass) {
      return html``;
    }

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
        <div class="card-content grid" style="[[contentStyle]]">
          ${this.renderHistory(this.history, this.config)}
        </div>
      </ha-card>
    `;
  }

  renderHistory(items: History[] | undefined, config: LogbookCardConfig): TemplateResult {
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

  renderHistoryItems(items: History[]): TemplateResult {
    return html`
      ${items?.map((item, index, array) => this.renderHistoryItem(item, index + 1 === array.length))}
    `;
  }

  renderHistoryItem(item: History, isLast: boolean): TemplateResult {
    return html`
      <div class="item">
        ${this.renderIcon(item)}
        <div class="item-content">
          ${this.config?.show?.state
            ? html`
                <span class="state">${item.label}</span>
              `
            : html``}
          ${this.config?.show?.duration
            ? html`
                <span class="duration">${item.duration}</span>
              `
            : html``}
          ${this.renderHistoryDate(item)}${item.attributes?.map(this.renderAttributes)}
        </div>
      </div>
      ${!isLast ? this.renderSeparator() : ``}
    `;
  }

  renderSeparator(): TemplateResult | void {
    const style: StyleInfo = {
      border: '0',
      'border-top': `${this.config?.separator_style?.width}px ${this.config?.separator_style?.style} ${this.config?.separator_style?.color}`,
    };
    if (this.config?.show?.separator) {
      return html`
        <hr style=${styleMap(style)} aria-hidden="true" />
      `;
    }
  }

  renderIcon(item: History): TemplateResult | void {
    if (this.config?.show?.icon) {
      return html`
        <div class="item-icon">
          <ha-icon .icon=${item.icon.icon} style=${item.icon.color ? `color: ${item.icon.color}` : ``}></ha-icon>
        </div>
      `;
    }
  }

  renderHistoryDate(item: History): TemplateResult {
    if (this.config?.show?.start_date && this.config?.show?.end_date) {
      return html`
        <div class="date">${this._displayDate(item.start)} - ${this._displayDate(item.end)}</div>
      `;
    }
    if (this.config?.show?.end_date) {
      return html`
        <div class="date">${this._displayDate(item.end)}</div>
      `;
    }
    if (this.config?.show?.start_date) {
      return html`
        <div class="date">${this._displayDate(item.start)}</div>
      `;
    }
    return html``;
  }

  renderAttributes(attribute: Attribute): TemplateResult {
    return html`
      <div class="attribute">
        <div class="key">${attribute.name}</div>
        <div class="value">${attribute.value}</div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .card-content {
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
        flex: 0 0 40px;
        color: var(--paper-item-icon-color, #44739e);
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
        max-height: 0;
        overflow: hidden;
      }
      .expand:checked + label + div {
        max-height: 1000px;
      }
    `;
  }
}
