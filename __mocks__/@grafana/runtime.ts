import React from 'react';
import * as actual from '@grafana/runtime';

export * from '@grafana/runtime';

export const PluginPage = ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children);

// Re-export everything else from the actual module
export default actual;
