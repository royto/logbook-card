import { DEFAULT_SHOW } from './const';
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';

import { LogbookCardConfig } from './types';

const options = {
  required: {
    icon: 'tune',
    name: 'Required',
    secondary: 'Required options for this card to function',
    show: true,
  },
  showOptions: {
    icon: 'toggle-switch',
    name: 'Show',
    secondary: 'Customize what to display',
    show: false,
  },
  appearance: {
    icon: 'palette',
    name: 'Appearance',
    secondary: 'Customize the title, number of events to display, etc',
    show: false,
  },
};

@customElement('logbook-card-editor')
export class LogbookCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Partial<LogbookCardConfig>;
  @state() private _toggle?: boolean;
  @state() private _helpers?: any;
  private _initialized = false;

  public setConfig(config: LogbookCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  get _title(): string {
    if (this._config) {
      return this._config.title || '';
    }

    return '';
  }

  get _entity(): string {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _history(): number {
    if (this._config) {
      return this._config.history || 5;
    }

    return 5;
  }

  get _desc(): boolean {
    if (this._config && this._config.desc !== undefined) {
      return this._config.desc;
    }

    return true;
  }

  get _date_format(): string {
    if (this._config) {
      return this._config.date_format || '';
    }

    return '';
  }

  get _no_event(): string {
    if (this._config) {
      return this._config.no_event || '';
    }

    return '';
  }

  get _max_items(): number {
    if (this._config) {
      return this._config.max_items || -1;
    }

    return -1;
  }

  get _collapse(): number | undefined {
    if (this._config) {
      return this._config.collapse;
    }

    return undefined;
  }

  get _show_state(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.state;
    }

    return true;
  }

  get _show_duration(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.duration;
    }

    return true;
  }

  get _show_start_date(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.start_date;
    }

    return true;
  }

  get _show_end_date(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.end_date;
    }

    return true;
  }

  get _show_icon(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.icon;
    }

    return true;
  }

  get _show_separator(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.separator;
    }

    return false;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    // You can restrict on domain type
    const entities = Object.keys(this.hass.states).sort();

    return html`
      <div class="card-config">
        <div class="option" @click=${this._toggleOption} .option=${'required'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.required.icon}`}></ha-icon>
            <div class="title">${options.required.name}</div>
          </div>
          <div class="secondary">${options.required.secondary}</div>
        </div>
        ${options.required.show
          ? html`
              <div class="values">
                <paper-dropdown-menu
                  label="Entity (Required)"
                  @value-changed=${this._valueChanged}
                  .configValue=${'entity'}
                >
                  <paper-listbox slot="dropdown-content" .selected=${entities.indexOf(this._entity)}>
                    ${entities.map(entity => {
                      return html`
                        <paper-item>${entity}</paper-item>
                      `;
                    })}
                  </paper-listbox>
                </paper-dropdown-menu>
              </div>
            `
          : ''}
        <div class="option" @click=${this._toggleOption} .option=${'appearance'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.appearance.icon}`}></ha-icon>
            <div class="title">${options.appearance.name}</div>
          </div>
          <div class="secondary">${options.appearance.secondary}</div>
        </div>
        ${options.appearance.show
          ? html`
              <div class="values">
                <paper-input
                  label="Title (Optional)"
                  .value=${this._title}
                  .configValue=${'title'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  type="number"
                  label="History: Numbers of days of history of the logbook"
                  min="1"
                  .value=${this._history}
                  .configValue=${'history'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  type="number"
                  min="-1"
                  label="Max Items: Maximum of events to display (-1 to display all events)"
                  .value=${this._max_items}
                  .configValue=${'max_items'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Text when no event"
                  .value=${this._no_event}
                  .configValue=${'no_event'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  type="number"
                  label="Collapse: Number of entities to show. Rest will be available in expandable section"
                  .value=${this._collapse}
                  .configValue=${'collapse'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Date format"
                  .value=${this._date_format}
                  .configValue=${'date_format'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <p>
                  <ha-formfield .label=${`Display events descending ${this._desc ? 'on' : 'off'}`}>
                    <ha-switch
                      aria-label=${`Toggle desc ${this._desc ? 'on' : 'off'}`}
                      .checked=${this._desc !== false}
                      .configValue=${'desc'}
                      @change=${this._valueChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>
              </div>
            `
          : ''}
        <div class="option" @click=${this._toggleOption} .option=${'showOptions'}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.showOptions.icon}`}></ha-icon>
            <div class="title">${options.showOptions.name}</div>
          </div>
          <div class="secondary">${options.showOptions.secondary}</div>
        </div>
        ${options.showOptions.show
          ? html`
              <div class="values">
                <p>
                  <ha-formfield .label=${`Display state`}>
                    <ha-switch
                      aria-label=${`Toggle display of state ${this._show_state ? 'off' : 'on'}`}
                      .checked=${this._show_state !== false}
                      .configValue=${'state'}
                      @change=${this._showOptionChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>
                <p>
                  <ha-formfield .label=${`Display duration`}>
                    <ha-switch
                      aria-label=${`Toggle display of duration ${this._show_state ? 'off' : 'on'}`}
                      .checked=${this._show_duration !== false}
                      .configValue=${'duration'}
                      @change=${this._showOptionChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>

                <ha-formfield .label=${`Display start date`}>
                  <ha-switch
                    aria-label=${`Toggle display of start date ${this._show_start_date ? 'off' : 'on'}`}
                    .checked=${this._show_start_date !== false}
                    .configValue=${'start_date'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                </p>
                <p>
                  <ha-formfield .label=${`Display end date`}>
                    <ha-switch
                      aria-label=${`Toggle display of end date ${this._show_end_date ? 'off' : 'on'}`}
                      .checked=${this._show_end_date !== false}
                      .configValue=${'end_date'}
                      @change=${this._showOptionChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>
                <p>
                  <ha-formfield .label=${`Display icon`}>
                    <ha-switch
                      aria-label=${`Toggle display of icon ${this._show_icon ? 'off' : 'on'}`}
                      .checked=${this._show_icon === true}
                      .configValue=${'icon'}
                      @change=${this._showOptionChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>
                <p>
                  <ha-formfield .label=${`Display separator`}>
                    <ha-switch
                      aria-label=${`Toggle display of event separator ${this._show_separator ? 'off' : 'on'}`}
                      .checked=${this._show_separator !== false}
                      .configValue=${'separator'}
                      @change=${this._showOptionChanged}
                    ></ha-switch>
                  </ha-formfield>
                </p>  
              </div>
            `
          : ''}
      </div>

      <p class="note">
        Note: Setting hidden_state, duration_labels, attributes, separator_style, state_map are available exclusively
        using Code Editor.
      </p>
    `;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _toggleOption(ev): void {
    this._toggleThing(ev, options);
  }

  private _toggleThing(ev, optionList): void {
    const show = !optionList[ev.target.option].show;
    for (const [key] of Object.entries(optionList)) {
      optionList[key].show = false;
    }
    optionList[ev.target.option].show = show;
    this._toggle = !this._toggle;
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined
              ? target.checked
              : target.attributes['type'] &&
                target.attributes['type'].value === 'number' &&
                Number.parseInt(target.value)
              ? Number.parseInt(target.value)
              : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _showOptionChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (target.configValue) {
      this._config = {
        ...this._config,
        show: {
          ...(this._config.show || DEFAULT_SHOW),
          [target.configValue]: target.checked,
        },
      };
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
      }
      ha-switch {
        padding-bottom: 8px;
      }
      .note {
        font-weight: bold;
      }
    `;
  }
}
