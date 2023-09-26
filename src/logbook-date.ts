import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { LogbookCardConfig, ExtendedHomeAssistant } from './types';
import { displayDate } from './formatter';

@customElement('logbook-date')
export class LogbookDate extends LitElement {
  @property({ type: Object }) public hass!: ExtendedHomeAssistant;
  @property({ type: Object }) public config!: LogbookCardConfig;
  @property({ attribute: false }) public date!: Date;

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass || !this.date) {
      return html``;
    }

    return html`
      ${displayDate(this.hass, this.date, this.config.date_format)}
    `;
  }
}
