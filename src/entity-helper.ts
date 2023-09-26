import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { Attribute, AttributeConfig, ExtendedHomeAssistant, IconState, LogbookCardConfig, StateMap } from './types';
import { computeStateDisplay, stateIcon } from 'custom-card-helpers';
import { formatAttributeValue, formatEntityAttributeValue } from './formatter';
import { addSlashes } from './helpers';

export const mapState = (hass: ExtendedHomeAssistant, entity: HassEntity, states: StateMap[]): string => {
  const s = states.find(s => s.regexp?.test(entity.state));
  if (s !== undefined && s.label) {
    return s.label;
  }

  if (hass) {
    if (hass.formatEntityState) {
      return hass.formatEntityState(entity);
    }
    return computeStateDisplay(hass.localize, entity, hass.locale!);
  }

  return entity.state;
};

export const mapIcon = (item: HassEntity, states: StateMap[]): IconState | null => {
  const s = states.find(s => s.regexp?.test(addSlashes(item.state)));
  if (s === undefined || (s.icon === undefined && s.icon_color === undefined)) {
    return null;
  }

  const iconSvg = s !== undefined && s.icon ? s.icon : stateIcon(item);

  return { icon: iconSvg, color: s?.icon_color || null };
};

export const extractAttributes = (
  item: HassEntity,
  config: LogbookCardConfig,
  hass: ExtendedHomeAssistant,
): Array<Attribute> => {
  if (config?.attributes == null) {
    return [];
  }

  return config?.attributes.reduce((p: Array<Attribute>, c: AttributeConfig): Array<Attribute> => {
    if (item.attributes[c.value]) {
      const attribute = item.attributes[c.value];
      if (typeof attribute === 'object' && !Array.isArray(attribute)) {
        const keys = Object.keys(attribute);
        keys.forEach(key => {
          p.push({
            name: key,
            value: formatAttributeValue(hass, attribute[key], undefined, config.date_format),
          });
        });
      } else if (Array.isArray(attribute)) {
        p.push({
          name: c.label ? c.label : c.value,
          value: formatAttributeValue(hass, attribute.join(','), undefined, config.date_format),
        });
      } else {
        const attributeName = hass.formatEntityAttributeName ? hass.formatEntityAttributeName(item, c.value) : c.value;
        p.push({
          name: c.label ? c.label : attributeName,
          value: formatEntityAttributeValue(hass, item, c.value, attribute, c.type, config.date_format),
        });
      }
    }
    return p;
  }, []);
};
