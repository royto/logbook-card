import { CustomLogEvent, ExtendedHomeAssistant, LogbookCardConfig } from './types';

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

export const toCustomLogs = (entries: LogbookEntry[]): CustomLogEvent[] => {
  return entries
    .filter(e => e.context_service === logbookLogContext)
    .map(e => ({
      type: 'customLog',
      start: new Date(e.when),
      name: e.name,
      message: e.message || '',
    }));
};

export const getCustomLogsPromise = (
  hass: ExtendedHomeAssistant,
  config: LogbookCardConfig,
  startDate: Date,
): Promise<CustomLogEvent[]> => {
  if (config.custom_logs) {
    const endTime = new Date().toISOString();
    return hass
      .callApi<LogbookEntry[]>('GET', `logbook/${startDate.toISOString()}?entity=${config.entity}&end_time=${endTime}`)
      .then(response => toCustomLogs(response));
  }
  return Promise.resolve([]);
};
