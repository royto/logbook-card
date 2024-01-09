import { CustomLogEvent, ExtendedHomeAssistant } from './types';

const logbookLogContext = 'log';

export interface LogbookEntry {
  // Base data
  when: number; // Python timestamp. Do *1000 to get JS timestamp.
  name: string;
  message?: string;
  entity_id?: string;
  icon?: string;
  source?: string; // The trigger source
  domain?: string;
  state?: string; // The state of the entity
  // Context data
  context_id?: string;
  context_user_id?: string;
  context_event_type?: string;
  context_domain?: string;
  context_service?: string; // Service calls only
  context_entity_id?: string;
  context_entity_id_name?: string; // Legacy, not longer sent
  context_name?: string;
  context_state?: string; // The state of the entity
  context_source?: string; // The trigger source
  context_message?: string;
}

const matchEntry = (entry: LogbookEntry, m: CustomLogMap): boolean => {
  if (m.message && m.name) {
    return m.name.test(entry.name) && m.message.test(entry.message || '');
  }

  if (m.message) {
    return m.message?.test(entry.message || '');
  }

  if (m.name) {
    return m.name.test(entry.name);
  }

  return false;
};

const findMatchingLogMap = (entry: LogbookEntry, customLogMaps: CustomLogMap[]): CustomLogMap | undefined => {
  return customLogMaps.find(m => matchEntry(entry, m));
};

const mapIcon = (entry: LogbookEntry, customLogMap: CustomLogMap[]): string | undefined => {
  return findMatchingLogMap(entry, customLogMap)?.icon;
};

const mapIconColor = (entry: LogbookEntry, customLogMap: CustomLogMap[]): string | undefined => {
  return findMatchingLogMap(entry, customLogMap)?.icon_color;
};

const customLogType = 'customLog';
const triggerByAutomation = 'automation_triggered';

const isCustomLog = (entry: LogbookEntry): boolean => {
  return entry.context_service === logbookLogContext || entry.context_event_type === triggerByAutomation;
};

const isTriggeredAutomation = (entry: LogbookEntry): boolean => {
  return entry.domain === 'automation';
};

const isTriggeredByScript = (entry: LogbookEntry): boolean => {
  return entry.context_domain === 'script';
};

const notHidden = (entry: LogbookEntry, logMap: CustomLogMap[]): boolean => {
  return !logMap.filter(l => l.hidden).some(log => matchEntry(entry, log));
};

export const toCustomLogs = (entityConfig: EntityCustomLogConfig, entries: LogbookEntry[]): CustomLogEvent[] => {
  return entries
    .filter(entry => isCustomLog(entry) || isTriggeredAutomation(entry) || isTriggeredByScript(entry))
    .filter(entry => notHidden(entry, entityConfig.log_map))
    .map(e => ({
      type: customLogType,
      start: new Date(e.when),
      name: e.name,
      message: e.message || '',
      entity: entityConfig.entity,
      entity_name: entityConfig.entity_name || entityConfig.entity,
      icon: mapIcon(e, entityConfig.log_map),
      icon_color: mapIconColor(e, entityConfig.log_map),
    }));
};

export interface EntityCustomLogConfig {
  entity: string;
  entity_name?: string;
  custom_logs: boolean;
  log_map: CustomLogMap[];
}

export interface CustomLogMap {
  name?: RegExp;
  message?: RegExp;
  icon?: string;
  icon_color?: string;
  hidden: boolean;
}

export const getCustomLogsPromise = (
  hass: ExtendedHomeAssistant,
  config: EntityCustomLogConfig,
  startDate: Date,
): Promise<CustomLogEvent[]> => {
  if (config.custom_logs) {
    const endTime = new Date().toISOString();
    return hass
      .callApi<LogbookEntry[]>('GET', `logbook/${startDate.toISOString()}?entity=${config.entity}&end_time=${endTime}`)
      .then(response => toCustomLogs(config, response));
  }
  return Promise.resolve([]);
};
