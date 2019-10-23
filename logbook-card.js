class LogbookCard extends Polymer.Element {

    static get template() {
        return Polymer.html`
          <style>
            .content {
              cursor: pointer;
            }
            .item {
              font-size: 1.2em;
            }
            .duration {
              font-size: 0.85em;
              font-style: italic;
              float: right;
            }

            .date {
              font-size: 0.7em;
            }
          </style>
          <ha-card hass="[[_hass]]" config="[[_config]]">
            <template is="dom-if" if="{{title}}">
              <div class="card-header">
                <div class="name">[[title]]</div>  
              </div>
            </template>
            <div class="card-content grid" style="[[contentStyle]]">
              <div>
                <template is="dom-repeat" rendered-item-count="{{itemsCount}}" items="{{history}}">
                  <div class="item">
                    <span>[[item.state]]</span> 
                    <span class="duration">[[getDuration(item.duration)]]</span>
                    <div class="date"> [[_displayDate(item.start)]] - [[_displayDate(item.end)]]</div>
                  </div>
                </template>

                <template is="dom-if" if="{{!itemsCount}}">
                  [[_config.no_event]]
                </template>
              </div>
            </div>
            </ha-card>
        `;
    }

    getCardSize() {
        if (this.title && this.showButtons) return 5;
        if (this.title || this.showButtons) return 4;
        return 3;
    }

    _displayDate(date) {
        return date.toLocaleString(this._hass.language);
    }

    getDuration(durationInMs) {
        if (!durationInMs) {
            return '';
        }
        const durationInS = durationInMs / 1000;
        if (durationInS < 60) {
            return Math.round(durationInS) + 's';
        }
        const durationInMin = durationInS / 60;
        if (durationInMin < 60) {
            return Math.round(durationInMin) + 'm';
        }
        const durationInHours = durationInMin / 60;
        if (durationInHours < 24) {
            return Math.round(durationInHours) + 'h';
        }
        return Math.round(durationInHours / 24) + 'd';
    }

    setConfig(config) {
        const labels = {
            duration: 'duration'
        };

        const defaultConfig = {
            history: 5,
            hiddenState: [],
            desc: true,
            no_event: 'No event on the period'
        };

        this._config = Object.assign(defaultConfig, config);

        if (!config.entity) throw new Error('Please define an entity.');
        //if hiddenState != Array 
    }

    set hass(hass) {
        this._hass = hass;

        if (hass && this._config) {
            this.stateObj = this._config.entity in hass.states ? hass.states[this._config.entity] : null;

            const startDate = new Date(new Date().setDate(new Date().getDate() - this._config.history));

            const uri = 'history/period/' + startDate.toISOString() +
                '?filter_entity_id=' + this._config.entity +
                '&end_time=' + new Date().toISOString();

            this._hass.callApi('get', uri)
                .then(history => {
                    this.history = history[0].map(hist => ({
                        state: hist.state,
                        start: new Date(hist.last_changed)
                    }))
                        .map((x, i, arr) => {
                            if (i < arr.length - 1) {
                                return {
                                    ...x,
                                    end: arr[i + 1].start
                                }
                            };
                            return { ...x, end: new Date() }
                        })
                        .map(x => ({
                            ...x,
                            duration: x.end - x.start
                        }))
                        .filter(x => !this._config.hiddenState.includes(x.state));

                    if (this._config.desc === true) {
                        this.history = this.history.reverse();
                    }
                });

            if (this.stateObj) {
                this.title = this._config.title !== false && (this._config.title || this.stateObj.attributes.friendly_name + ' History');
            }
        }
    }
}

customElements.define('logbook-card', LogbookCard);
