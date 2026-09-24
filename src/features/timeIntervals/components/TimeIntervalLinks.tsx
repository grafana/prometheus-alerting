import React, { Fragment } from 'react';
import { TextLink } from '@grafana/ui';

import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { timeIntervals as timeIntervalsNav } from '../../../utils/navigation';

interface TimeIntervalLinksProps {
  names: string[];
}

/**
 * A comma-separated list of time interval names, each linking to the time intervals page with
 * that interval's drawer open.
 */
export function TimeIntervalLinks({ names }: TimeIntervalLinksProps) {
  const { uid: alertmanagerUID } = useAlertmanager();

  return (
    <span>
      {names.map((name, index) => (
        <Fragment key={name}>
          <TextLink href={timeIntervalsNav.listPageLink(alertmanagerUID, name)} inline>
            {name}
          </TextLink>
          {index < names.length - 1 && ', '}
        </Fragment>
      ))}
    </span>
  );
}
