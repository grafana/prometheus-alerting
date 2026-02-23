import { AlertStatusFactory, GettableAlertFactory } from '../mocks/alerts.fakes';
import { countAlertsByState } from './alerts.utils';

describe('countAlertsByState', () => {
  it('returns all zeros for an empty list', () => {
    expect(countAlertsByState([])).toEqual({
      active: 0,
      unprocessed: 0,
      suppressed: 0,
      silenced: 0,
      inhibited: 0,
      muted: 0,
    });
  });

  it('counts active alerts', () => {
    const alerts = GettableAlertFactory.buildList(2, { status: AlertStatusFactory.build({ state: 'active' }) });
    expect(countAlertsByState(alerts).active).toBe(2);
  });

  it('counts unprocessed alerts', () => {
    const alerts = GettableAlertFactory.buildList(1, { status: AlertStatusFactory.build({ state: 'unprocessed' }) });
    expect(countAlertsByState(alerts).unprocessed).toBe(1);
  });

  it('counts suppressed alerts', () => {
    const alerts = GettableAlertFactory.buildList(2, {
      status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['silence-1'] }),
    });
    expect(countAlertsByState(alerts).suppressed).toBe(2);
  });

  it('counts suppressed sub-reasons independently', () => {
    const alerts = [
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['s1'] }) }),
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', inhibitedBy: ['i1'] }) }),
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', mutedBy: ['m1'] }) }),
    ];
    const counts = countAlertsByState(alerts);
    expect(counts.silenced).toBe(1);
    expect(counts.inhibited).toBe(1);
    expect(counts.muted).toBe(1);
  });

  it('counts a suppressed alert in multiple sub-reason buckets simultaneously', () => {
    const alert = GettableAlertFactory.build({
      status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['s1'], inhibitedBy: ['i1'] }),
    });
    const counts = countAlertsByState([alert]);
    expect(counts.suppressed).toBe(1);
    expect(counts.silenced).toBe(1);
    expect(counts.inhibited).toBe(1);
  });
});
