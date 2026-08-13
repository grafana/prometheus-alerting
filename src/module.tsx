import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { initPluginTranslations } from '@grafana/i18n';
import type { AppConfigProps } from './components/AppConfig/AppConfig';
import { PluginErrorBoundary } from './components/ErrorBoundary/PluginErrorBoundary';
import pluginJson from './plugin.json';

// Initialize plugin translations
await initPluginTranslations(pluginJson.id);

const LazyApp = lazy(() => import('./components/App/App'));
const LazyAppConfig = lazy(() => import('./components/AppConfig/AppConfig'));

const App = (props: AppRootProps) => (
  <PluginErrorBoundary boundaryName="plugin-root" style="page">
    <Suspense fallback={<LoadingPlaceholder text="" />}>
      <LazyApp {...props} />
    </Suspense>
  </PluginErrorBoundary>
);

const AppConfig = (props: AppConfigProps) => (
  <PluginErrorBoundary boundaryName="plugin-config" style="page">
    <Suspense fallback={<LoadingPlaceholder text="" />}>
      <LazyAppConfig {...props} />
    </Suspense>
  </PluginErrorBoundary>
);

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
