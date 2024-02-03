import { DEFAULT_SHOW } from './const';
import { LitElement, html, TemplateResult, CSSResult, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { LogbookCardConfig } from './types';
import { localize } from './localize/localize';

const options = {
  required: {
    icon: 'tune',
    name: localize('editor.required_option_name'),
    secondary: localize('editor.required_option_name'),
    show: true,
  },
  showOptions: {
    icon: 'toggle-switch',
    name: localize('editor.show_option_name'),
    secondary: localize('editor.show_option_description'),
    show: false,
  },
  appearance: {
    icon: 'palette',
    name: localize('editor.appearance_option_name'),
    secondary: localize('editor.appearance_option_description'),
    show: false,
  },
};

@customElement('logbook-card-editor')
export class LogbookCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: Partial<LogbookCardConfig>;
  @state() private _toggle?: boolean;
  @state() private _helpers?: any;

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

  get _hours_to_show(): number | '' {
    if (this._config) {
      return this._config.hours_to_show || '';
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

    return DEFAULT_SHOW.state;
  }

  get _show_duration(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.duration;
    }

    return DEFAULT_SHOW.duration;
  }

  get _show_start_date(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.start_date;
    }

    return DEFAULT_SHOW.start_date;
  }

  get _show_end_date(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.end_date;
    }

    return DEFAULT_SHOW.end_date;
  }

  get _show_icon(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.icon;
    }

    return DEFAULT_SHOW.icon;
  }

  get _show_separator(): boolean {
    if (this._config && this._config.show) {
      return this._config.show?.separator;
    }

    return DEFAULT_SHOW.separator;
  }

  get _custom_logs(): boolean {
    return this._config?.custom_logs || false;
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
          <ha-icon class="option-icon" .icon=${`mdi:${options.required.icon}`}></ha-icon>
          <div class="option-title">${options.required.name}</div>
          <div class="option-secondary">${options.required.secondary}</div>
        </div>
        ${options.required.show
          ? html`
              <div class="values">
                <ha-select
                  naturalMenuWidth
                  fixedMenuPosition
                  .label=${localize('editor.entity_label')}
                  .configValue=${'entity'}
                  .value=${this._entity}
                  @selected=${this._valueChanged}
                  @closed=${ev => ev.stopPropagation()}
                >
                  ${entities.map(entity => {
                    return html`
                      <mwc-list-item .value=${entity}>${entity}</mwc-list-item>
                    `;
                  })}
                </ha-select>
              </div>
            `
          : ''}
        <div class="option" @click=${this._toggleOption} .option=${'appearance'}>
          <ha-icon class="option-icon" .icon=${`mdi:${options.appearance.icon}`}></ha-icon>
          <div class="option-title">${options.appearance.name}</div>
          <div class="option-secondary">${options.appearance.secondary}</div>
        </div>
        ${options.appearance.show
          ? html`
              <div class="values">
                <ha-textfield
                  .label=${localize('editor.title_label')}
                  .value=${this._title}
                  .configValue=${'title'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <ha-textfield
                  type="number"
                  .label=${localize('editor.hours_to_show_label')}
                  min="1"
                  .value=${this._hours_to_show}
                  .configValue=${'hours_to_show'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <ha-textfield
                  type="number"
                  min="-1"
                  .label=${localize('editor.max_items_label')}
                  .value=${this._max_items}
                  .configValue=${'max_items'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <ha-textfield
                  .label=${localize('editor.no_event_label')}
                  .value=${this._no_event}
                  .configValue=${'no_event'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <ha-textfield
                  type="number"
                  .label=${localize('editor.collapse_label')}
                  .value=${this._collapse}
                  .configValue=${'collapse'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <ha-textfield
                  .label=${localize('editor.date_format_label')}
                  .value=${this._date_format}
                  .configValue=${'date_format'}
                  @input=${this._valueChanged}
                ></ha-textfield>
                <p>
                  <ha-formfield .label=${localize('editor.desc_label')}>
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
          <ha-icon class="option-icon" .icon=${`mdi:${options.showOptions.icon}`}></ha-icon>
          <div class="option-title">${options.showOptions.name}</div>
          <div class="option-secondary">${options.showOptions.secondary}</div>
        </div>
        ${options.showOptions.show
          ? html`
              <div class="values">
                <ha-formfield .label=${localize(`editor.display_state_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of state ${this._show_state ? 'off' : 'on'}`}
                    .checked=${this._show_state !== false}
                    .configValue=${'state'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_duration_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of duration ${this._show_state ? 'off' : 'on'}`}
                    .checked=${this._show_duration !== false}
                    .configValue=${'duration'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_start_date_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of start date ${this._show_start_date ? 'off' : 'on'}`}
                    .checked=${this._show_start_date !== false}
                    .configValue=${'start_date'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_end_date_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of end date ${this._show_end_date ? 'off' : 'on'}`}
                    .checked=${this._show_end_date !== false}
                    .configValue=${'end_date'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_icon_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of icon ${this._show_icon ? 'off' : 'on'}`}
                    .checked=${this._show_icon === true}
                    .configValue=${'icon'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_separator_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of event separator ${this._show_separator ? 'off' : 'on'}`}
                    .checked=${this._show_separator !== false}
                    .configValue=${'separator'}
                    @change=${this._showOptionChanged}
                  ></ha-switch>
                </ha-formfield>
                <ha-formfield .label=${localize(`editor.display_custom_logs_label`)}>
                  <ha-switch
                    aria-label=${`Toggle display of custom logs ${this._custom_logs ? 'off' : 'on'}`}
                    .checked=${this._custom_logs !== false}
                    .configValue=${'custom_logs'}
                    @change=${this._valueChanged}
                  ></ha-switch>
                </ha-formfield>
              </div>
            `
          : ''}
      </div>

      <p class="note">
        ${localize('editor.note')}
      </p>
    `;
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
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
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
        padding-block: 0.5rem;
        cursor: pointer;
        display: grid;
        grid-template-areas:
          'icon title'
          'icon secondary';
        grid-template-columns: 2rem auto;
        column-gap: 0.5rem;
      }
      .option > * {
        pointer-events: none;
      }
      .option-title {
        grid-area: title;
      }
      .option-icon {
        grid-area: icon;
        align-self: center;
      }
      .option-secondary {
        grid-area: secondary;
      }
      .values {
        padding-inline: 1rem;
        padding-block: 0.5rem;
      }
      ha-select,
      ha-textfield {
        margin-bottom: 1rem;
        display: block;
      }
      ha-formfield {
        display: block;
        margin-inline: 0.5rem;
        margin-block: 1rem;
      }
      ha-switch {
        --mdc-theme-secondary: var(--switch-checked-color);
      }
      .note {
        font-weight: bold;
      }
    `;
  }
}
