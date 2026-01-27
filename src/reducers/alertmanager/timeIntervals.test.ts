import { initialAlertmanagerConfiguration, PostableParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { addTimeInterval, deleteTimeInterval, timeIntervalsReducer, updateTimeInterval } from './timeIntervals';
import { TimeInterval } from '@grafana/external-alertmanager/vanilla';

describe('mute timings', () => {
  const initialConfig: PostableParsedUserConfiguration = {
    alertmanager_config: {
      ...initialAlertmanagerConfiguration.alertmanager_config,
      time_intervals: [mockTimeInterval({ name: 'default time interval' })],
      mute_time_intervals: [mockTimeInterval({ name: 'default legacy time interval' })],
      route: {
        routes: [
          {
            mute_time_intervals: ['default time interval'],
          },
          {
            mute_time_intervals: ['default legacy time interval'],
          },
        ],
      },
    },
    template_files: {},
  };

  it('should be able to add a new mute timing', () => {
    const newMuteTiming = mockTimeInterval({ name: 'new mute time interval' });
    const action = addTimeInterval({ interval: newMuteTiming });

    expect(timeIntervalsReducer(initialConfig, action)).toMatchSnapshot();
  });

  it('should be able to remove a mute timing', () => {
    const legacyMuteTimingName = initialConfig.alertmanager_config.mute_time_intervals![0].name;
    const deleteFromLegacyKey = deleteTimeInterval({ name: legacyMuteTimingName });
    expect(timeIntervalsReducer(initialConfig, deleteFromLegacyKey)).toMatchSnapshot();

    const muteTimingName = initialConfig.alertmanager_config.time_intervals![0].name;
    const deleteMuteTiming = deleteTimeInterval({ name: muteTimingName });
    expect(timeIntervalsReducer(initialConfig, deleteMuteTiming)).toMatchSnapshot();
  });

  it('should be able to update a time interval', () => {
    const newMuteTiming = mockTimeInterval({ name: 'new mute time interval' });

    const legacyMuteTimingName = initialConfig.alertmanager_config.mute_time_intervals![0].name;
    const updateLegacyMuteTiming = updateTimeInterval({
      originalName: legacyMuteTimingName,
      interval: newMuteTiming,
    });
    expect(timeIntervalsReducer(initialConfig, updateLegacyMuteTiming)).toMatchSnapshot();

    const muteTimingName = initialConfig.alertmanager_config.time_intervals![0].name;
    const updateMuteTiming = updateTimeInterval({ originalName: muteTimingName, interval: newMuteTiming });
    expect(timeIntervalsReducer(initialConfig, updateMuteTiming)).toMatchSnapshot();
  });
});

function mockTimeInterval(overrides: Partial<TimeInterval> = {}): TimeInterval {
  return {
    name: 'mock time interval',
    time_intervals: [
      {
        times: [
          {
            start_time: '12:00',
            end_time: '24:00',
          },
        ],
        days_of_month: ['15'],
        months: ['august:december', 'march'],
      },
    ],
    ...overrides,
  };
}
