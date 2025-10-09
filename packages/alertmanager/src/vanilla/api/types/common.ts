import type { Receiver } from './receivers';

export type GetStatusApiResponse = /** status 200 Get status response */ AlertmanagerStatus;
export type GetStatusApiArg = void;
export type GetReceiversApiResponse = /** status 200 Get receivers response */ Receiver[];
export type GetReceiversApiArg = void;
export type GetSilencesApiResponse = /** status 200 Get silences response */ GettableSilences;
export type GetSilencesApiArg = {
  /** A list of matchers to filter silences by */
  filter?: string[];
};
export type PostSilencesApiResponse = /** status 200 Create / update silence response */ {
  silenceID?: string;
};
export type PostSilencesApiArg = {
  /** The silence to create */
  postableSilence: PostableSilence;
};
export type GetSilenceApiResponse = /** status 200 Get silence response */ GettableSilence;
export type GetSilenceApiArg = {
  /** ID of the silence to get */
  silenceId: string;
};
export type DeleteSilenceApiResponse = unknown;
export type DeleteSilenceApiArg = {
  /** ID of the silence to get */
  silenceId: string;
};
export type GetAlertsApiResponse = /** status 200 Get alerts response */ GettableAlerts;
export type GetAlertsApiArg = {
  /** Show active alerts */
  active?: boolean;
  /** Show silenced alerts */
  silenced?: boolean;
  /** Show inhibited alerts */
  inhibited?: boolean;
  /** Show unprocessed alerts */
  unprocessed?: boolean;
  /** A list of matchers to filter alerts by */
  filter?: string[];
  /** A regex matching receivers to filter alerts by */
  receiver?: string;
};
export type PostAlertsApiResponse = unknown;
export type PostAlertsApiArg = {
  /** The alerts to create */
  postableAlerts: PostableAlerts;
};
export type GetAlertGroupsApiResponse = /** status 200 Get alert groups response */ AlertGroups;
export type GetAlertGroupsApiArg = {
  /** Show active alerts */
  active?: boolean;
  /** Show silenced alerts */
  silenced?: boolean;
  /** Show inhibited alerts */
  inhibited?: boolean;
  /** Show muted alerts */
  muted?: boolean;
  /** A list of matchers to filter alerts by */
  filter?: string[];
  /** A regex matching receivers to filter alerts by */
  receiver?: string;
};
export type PeerStatus = {
  name: string;
  address: string;
};
export type ClusterStatus = {
  name?: string;
  status: 'ready' | 'settling' | 'disabled';
  peers?: PeerStatus[];
};
export type VersionInfo = {
  version: string;
  revision: string;
  branch: string;
  buildUser: string;
  buildDate: string;
  goVersion: string;
};
export type TimeInterval = {
  name: string;
  time_intervals?: Array<{
    times?: Array<{
      start_time: string;
      end_time: string;
    }>;
    weekdays?: string[];
    days_of_month?: string[];
    months?: string[];
    years?: string[];
    location?: string;
  }>;
};

export type InhibitRule = {
  target_matchers?: string[];
  source_matchers?: string[];
  equal?: string[];
};

export type AlertmanagerConfig = {
  original: string /** this is the entire Alertmanager config, in YAML */;
  parsed?: {
    receivers?: Receiver[];
    route?: {
      receiver?: string;
      group_by?: string[];
      continue?: boolean;
      routes?: any[];
      group_wait?: string;
      group_interval?: string;
      repeat_interval?: string;
      matchers?: string[];
    };
    templates?: string[];
    time_intervals?: TimeInterval[];
    inhibit_rules?: InhibitRule[];
    [key: string]: any;
  };
};
export type AlertmanagerStatus = {
  cluster: ClusterStatus;
  versionInfo: VersionInfo;
  config: AlertmanagerConfig;
  uptime: string;
};

// Re-export receiver types for convenience
export type { Receiver } from './receivers';

export type SilenceStatus = {
  state: 'expired' | 'active' | 'pending';
};
export type Matcher = {
  name: string;
  value: string;
  isRegex: boolean;
  isEqual?: boolean;
};
export type Matchers = Matcher[];
export type Silence = {
  matchers: Matchers;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  comment: string;
};
export type GettableSilence = {
  id: string;
  status: SilenceStatus;
  updatedAt: string;
} & Silence;
export type GettableSilences = GettableSilence[];
export type PostableSilence = {
  id?: string;
} & Silence;
export type LabelSet = {
  [key: string]: string;
};
export type AlertStatus = {
  state: 'unprocessed' | 'active' | 'suppressed';
  silencedBy: string[];
  inhibitedBy: string[];
  mutedBy: string[];
};
export type Alert = {
  labels: LabelSet;
  generatorURL?: string;
};
export type GettableAlert = {
  annotations: LabelSet;
  receivers: Receiver[];
  fingerprint: string;
  startsAt: string;
  updatedAt: string;
  endsAt: string;
  status: AlertStatus;
} & Alert;
export type GettableAlerts = GettableAlert[];
export type PostableAlert = {
  startsAt?: string;
  endsAt?: string;
  annotations?: LabelSet;
} & Alert;
export type PostableAlerts = PostableAlert[];
export type AlertGroup = {
  labels: LabelSet;
  receiver: Receiver;
  alerts: GettableAlert[];
};
export type AlertGroups = AlertGroup[];
