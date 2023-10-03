import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { LogbookCardConfig, ExtendedHomeAssistant } from './types';
import { HumanizeDurationLanguage, HumanizeDuration, HumanizeDurationOptions } from 'humanize-duration-ts';

@customElement('logbook-duration')
export class LogbookDuration extends LitElement {
  @property({ type: Object }) public hass!: ExtendedHomeAssistant;
  @property({ type: Object }) public config!: LogbookCardConfig;
  @property({ type: Number }) public duration!: number;

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass || !this.duration) {
      return html``;
    }

    return html`
      ${this.getDuration(this.duration)}
    `;
  }

  private getDuration(durationInMs: number): string {
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
}
