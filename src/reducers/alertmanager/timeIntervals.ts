import { createAction, createReducer } from '@reduxjs/toolkit';
import { remove } from 'lodash';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { removeTimeIntervalFromRoute, renameTimeInterval } from './utils/muteTimings.utils';
import { initialAlertmanagerConfiguration } from '@grafana/external-alertmanager/mimir';

export const addTimeInterval = createAction<{ interval: TimeInterval }>('muteTiming/add');
export const updateTimeInterval = createAction<{
  interval: TimeInterval;
  originalName: string;
}>('muteTiming/update');
export const deleteTimeInterval = createAction<{ name: string }>('muteTiming/delete');

/**
 * This reducer will manage action related to mute timings and make sure all operations on the alertmanager
 * configuration happen immutably and only mutate what they need.
 */
export const timeIntervalsReducer = createReducer(initialAlertmanagerConfiguration, (builder) => {
  builder
    // add a mute timing to the alertmanager configuration
    .addCase(addTimeInterval, (draft, { payload }) => {
      const { interval } = payload;
      draft.alertmanager_config.time_intervals = (draft.alertmanager_config.time_intervals ?? []).concat(interval);
    })
    // add a mute timing to the alertmanager configuration
    // make sure we update the mute timing in either the deprecated or the new time intervals property
    .addCase(updateTimeInterval, (draft, { payload }) => {
      const { interval, originalName } = payload;
      const nameHasChanged = interval.name !== originalName;

      const timeIntervals = draft.alertmanager_config.time_intervals ?? [];
      const muteTimeIntervals = draft.alertmanager_config.mute_time_intervals ?? [];

      const existingIntervalIndex = timeIntervals.findIndex(({ name }) => name === originalName);
      if (existingIntervalIndex !== -1) {
        timeIntervals[existingIntervalIndex] = interval;
      }

      const existingMuteIntervalIndex = muteTimeIntervals.findIndex(({ name }) => name === originalName);
      if (existingMuteIntervalIndex !== -1) {
        muteTimeIntervals[existingMuteIntervalIndex] = interval;
      }

      if (nameHasChanged && draft.alertmanager_config.route) {
        draft.alertmanager_config.route = renameTimeInterval(
          interval.name,
          originalName,
          draft.alertmanager_config.route
        );
      }
    })
    // delete a mute timing from the alertmanager configuration, since the configuration might be using the "deprecated" mute_time_intervals
    // let's also check there
    .addCase(deleteTimeInterval, (draft, { payload }) => {
      const { name } = payload;
      const { alertmanager_config } = draft;
      const { time_intervals = [], mute_time_intervals = [] } = alertmanager_config;

      // remove the mute timings from the legacy and new time intervals definition
      remove(time_intervals, (interval) => interval.name === name);
      remove(mute_time_intervals, (interval) => interval.name === name);

      // remove the mute timing from all routes
      alertmanager_config.route = removeTimeIntervalFromRoute(name, alertmanager_config.route ?? {});
    });
});
