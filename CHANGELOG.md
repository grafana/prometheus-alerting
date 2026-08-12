# Changelog

## [1.5.0](https://github.com/grafana/prometheus-alerting/compare/v1.4.2...v1.5.0) (2026-08-12)


### 🎉 Features

* **observability:** add analytics module and app-level error boundary ([#190](https://github.com/grafana/prometheus-alerting/issues/190)) ([a4410e1](https://github.com/grafana/prometheus-alerting/commit/a4410e13589332211c9e75db2c5008edfce5f8c4))


### 📝 Documentation

* add CONTRIBUTING.md ([#191](https://github.com/grafana/prometheus-alerting/issues/191)) ([186524c](https://github.com/grafana/prometheus-alerting/commit/186524c5f3ad9d738c9730a68fbc91bd87d1ca39))

## [1.4.2](https://github.com/grafana/prometheus-alerting/compare/v1.4.1...v1.4.2) (2026-08-11)


### 🤖 Continuous Integrations

* Remove pending option from catalog publication ([#188](https://github.com/grafana/prometheus-alerting/issues/188)) ([31d43e3](https://github.com/grafana/prometheus-alerting/commit/31d43e37e51a8f47bacb95083df7c7938b87edf3))

## [1.4.1](https://github.com/grafana/prometheus-alerting/compare/v1.4.0...v1.4.1) (2026-08-11)


### 🐛 Bug Fixes

* **security:** percent-encode datasource proxy path segments ([#185](https://github.com/grafana/prometheus-alerting/issues/185)) ([99d4ddb](https://github.com/grafana/prometheus-alerting/commit/99d4ddb1b931e0a2b530ffccbbe208f20bbad5d4))
* **security:** update dompurify and nanoid to patched versions ([#186](https://github.com/grafana/prometheus-alerting/issues/186)) ([fee152a](https://github.com/grafana/prometheus-alerting/commit/fee152a7497212f727ab40c682e2e8dc3fcc4ad8))

## [1.4.0](https://github.com/grafana/prometheus-alerting/compare/v1.3.0...v1.4.0) (2026-08-10)


### 🎉 Features

* **inhibit-rules:** enforce RBAC on inhibit rules page ([#178](https://github.com/grafana/prometheus-alerting/issues/178)) ([8ad54a8](https://github.com/grafana/prometheus-alerting/commit/8ad54a81df357a85fc0afe4021516dc1c90af4c3))
* **receivers:** enforce RBAC on receivers page ([#173](https://github.com/grafana/prometheus-alerting/issues/173)) ([42c523b](https://github.com/grafana/prometheus-alerting/commit/42c523b5cdf18cef573b9d83c29ed162366da217))
* **silences:** enforce RBAC on silences page ([#181](https://github.com/grafana/prometheus-alerting/issues/181)) ([3facd2e](https://github.com/grafana/prometheus-alerting/commit/3facd2eaecf53f42e9135eddec391f59ca1af0d9))
* **templates:** enforce RBAC on templates page ([#174](https://github.com/grafana/prometheus-alerting/issues/174)) ([31050f7](https://github.com/grafana/prometheus-alerting/commit/31050f7d885fedc0bd1c59c3802004efac495cc8))
* **time-intervals:** enforce RBAC on time intervals page ([#175](https://github.com/grafana/prometheus-alerting/issues/175)) ([8441682](https://github.com/grafana/prometheus-alerting/commit/8441682972eb72cfdb37b36e5728ff748cc8634b))


### 🐛 Bug Fixes

* **security/high/:** update dependency js-yaml to v4.3.1 [security] ([#184](https://github.com/grafana/prometheus-alerting/issues/184)) ([a4b3151](https://github.com/grafana/prometheus-alerting/commit/a4b3151901f81bfdc9d2bab127e7f4dd70df903e))


### ♻️ Code Refactoring

* **silences:** extract duplicated formatDateTimeLocal helper ([#183](https://github.com/grafana/prometheus-alerting/issues/183)) ([3413163](https://github.com/grafana/prometheus-alerting/commit/3413163704186c24cbb64217640dea3c99b50e81))

## [1.3.0](https://github.com/grafana/prometheus-alerting/compare/v1.2.0...v1.3.0) (2026-08-04)


### 🎉 Features

* **routes:** enforce RBAC on routes page ([#168](https://github.com/grafana/prometheus-alerting/issues/168)) ([c7c58eb](https://github.com/grafana/prometheus-alerting/commit/c7c58eb468319b16e18d90673b71785bf5802e58))
* **rules:** add RBAC access controls ([#157](https://github.com/grafana/prometheus-alerting/issues/157)) ([307b993](https://github.com/grafana/prometheus-alerting/commit/307b99325a007b397a08de0b926d526f900ed3f8))
* **rules:** enforce RBAC in rule views and actions ([#158](https://github.com/grafana/prometheus-alerting/issues/158)) ([64fd1b1](https://github.com/grafana/prometheus-alerting/commit/64fd1b1f7608eccfafb6c8814e8da9a0713ff0cb))
* **rules:** protect editor workflows with RBAC ([#159](https://github.com/grafana/prometheus-alerting/issues/159)) ([f62738f](https://github.com/grafana/prometheus-alerting/commit/f62738f4adeb9496f91590b4ea2751851d0caff8))


### 🐛 Bug Fixes

* **alerts:** use TextLink for generator URL to prevent XSS, add lint rule ([#169](https://github.com/grafana/prometheus-alerting/issues/169)) ([c56477f](https://github.com/grafana/prometheus-alerting/commit/c56477f244d27ea62edb650ffc772f7a70600724))
* **rules:** deleting of rule only for a single one and not the entire rule group ([#166](https://github.com/grafana/prometheus-alerting/issues/166)) ([c30c1ed](https://github.com/grafana/prometheus-alerting/commit/c30c1ed492d1d1919f044d52a82cf0da4586bb7f))
* **security/high/:** update pnpm to v11.8.0 [security] ([#162](https://github.com/grafana/prometheus-alerting/issues/162)) ([8ac6c01](https://github.com/grafana/prometheus-alerting/commit/8ac6c01311a21008b0f2e5ca30247629ee9347a1))
* **security:** reject protocol-relative returnTo paths ([#170](https://github.com/grafana/prometheus-alerting/issues/170)) ([b16c7be](https://github.com/grafana/prometheus-alerting/commit/b16c7be56f0eb6b1170c77922a2525ab16801900))


### ♻️ Code Refactoring

* **rules:** use datasource proxy APIs ([#155](https://github.com/grafana/prometheus-alerting/issues/155)) ([f7a1471](https://github.com/grafana/prometheus-alerting/commit/f7a1471b20afb86945449b0c578b1e15fc14aa07))


### ✅ Tests

* **rules:** add group page e2e coverage ([#153](https://github.com/grafana/prometheus-alerting/issues/153)) ([492636d](https://github.com/grafana/prometheus-alerting/commit/492636d7ecf5faf3ad714031df0dfa27957c1c15))


### 🏗️ Builds

* bump everything to pnpm 11.17.0 ([#165](https://github.com/grafana/prometheus-alerting/issues/165)) ([80c1372](https://github.com/grafana/prometheus-alerting/commit/80c137273cf1c208c1ea353bbcf8536de0757376))
* **deps:** resolve audit vulnerabilities and bump toolchain ([#161](https://github.com/grafana/prometheus-alerting/issues/161)) ([c04b59d](https://github.com/grafana/prometheus-alerting/commit/c04b59d2544765ba8059d0f4d787bc1747077b15))

## [1.2.0](https://github.com/grafana/prometheus-alerting/compare/v1.1.0...v1.2.0) (2026-07-22)


### 🎉 Features

* add Mimir Alertmanager to test environment ([54fc4a5](https://github.com/grafana/prometheus-alerting/commit/54fc4a5be60cfc0c5baa37d2df6738118af0d454))
* add PopupCard component and improve rules filter UI ([cc5fbdc](https://github.com/grafana/prometheus-alerting/commit/cc5fbdc657b6680da6186d75d26650f45d481b74))
* **e2e:** add comprehensive E2E tests for RuleDetails page ([bd3b770](https://github.com/grafana/prometheus-alerting/commit/bd3b770d85d7033af58808afa2799f207f3ed6f5))
* full CRUD for inhibit rules on Mimir Alertmanager ([24737fb](https://github.com/grafana/prometheus-alerting/commit/24737fb9aecc581768bd39cf13fed9b7adea5c6b))
* pre-populate silence form createdBy with current user's email ([80963a8](https://github.com/grafana/prometheus-alerting/commit/80963a8783e1bdb9595df2db51ecdbcb1571fb66))
* **rules:** add native query editor for rule expressions ([fb43696](https://github.com/grafana/prometheus-alerting/commit/fb436960a71e11e09dcaa33e99866c5f14e715b6))
* **rules:** add syntax highlighting for PromQL and LogQL queries ([8d633fe](https://github.com/grafana/prometheus-alerting/commit/8d633fe7ecd2e65bfeaab8be88595f49fe656125))
* support Grafana 13.0 ([#66](https://github.com/grafana/prometheus-alerting/issues/66)) ([6886bcd](https://github.com/grafana/prometheus-alerting/commit/6886bcd91c9734c94c939d859912216b48913918))


### 🐛 Bug Fixes

* always recreate containers on npm run server to prevent stale network state ([179c8e6](https://github.com/grafana/prometheus-alerting/commit/179c8e6f9b5d7440ec018c070e46df8a8dc91f0d))
* **deps:** update dependency immer to v11 ([#116](https://github.com/grafana/prometheus-alerting/issues/116)) ([eb6f19a](https://github.com/grafana/prometheus-alerting/commit/eb6f19a0edb21ebeea837b303234f66ea01bb6bf))
* document standard schema cast workaround for zod v4 / RTK Query type mismatch ([77316fd](https://github.com/grafana/prometheus-alerting/commit/77316fdd93a9e9d35605e1f3dbd81088a909b4d7))
* make AlertStatusSchema array fields optional with empty defaults ([ce6baaa](https://github.com/grafana/prometheus-alerting/commit/ce6baaaa782e8fabe0929006f54fc545b90fd0a0))
* normalize deprecated inhibit rule matchers before populating form ([ec69639](https://github.com/grafana/prometheus-alerting/commit/ec696395f5e858b9b206d6289836c3381ed036d6))
* **receivers:** wait for list refetch before closing drawer ([#137](https://github.com/grafana/prometheus-alerting/issues/137)) ([7673a62](https://github.com/grafana/prometheus-alerting/commit/7673a62f13b3277c873344017718d98e7fbac241))
* **renovate:** trust mise config files in Renovate sandbox ([#124](https://github.com/grafana/prometheus-alerting/issues/124)) ([9a95e76](https://github.com/grafana/prometheus-alerting/commit/9a95e763d05761d1addb2aea96ef0ad77cc6020c))
* resolve pnpm audit security vulnerabilities ([#145](https://github.com/grafana/prometheus-alerting/issues/145)) ([8f25b34](https://github.com/grafana/prometheus-alerting/commit/8f25b34edd95cb4d5bb41f8a3802a6819c02ffa4))
* **rules:** disambiguate fully-identical duplicate rules via position matching ([#141](https://github.com/grafana/prometheus-alerting/issues/141)) ([50a2377](https://github.com/grafana/prometheus-alerting/commit/50a2377772b32ffeeb7dbe94250bbf3f50fd0fb0))
* **rules:** strip inline PromQL comments in hashQuery ([#128](https://github.com/grafana/prometheus-alerting/issues/128)) ([2f0ec56](https://github.com/grafana/prometheus-alerting/commit/2f0ec56bbe84ac6282343cfdcc1c7bad31aed830))
* **security/high:** update dependency happy-dom to v20.8.9 [security] ([#59](https://github.com/grafana/prometheus-alerting/issues/59)) ([bff98c8](https://github.com/grafana/prometheus-alerting/commit/bff98c8c0d73d57b8cc293cc3d39cd10a508df3e))
* **security/high:** update dependency vite to v7.3.2 [security] ([#61](https://github.com/grafana/prometheus-alerting/issues/61)) ([aef566c](https://github.com/grafana/prometheus-alerting/commit/aef566c8d509312d98371ea1156cdb9aee27f3c5))


### ♻️ Code Refactoring

* drop forked useAsync hook in favor of @react-hookz/web ([#150](https://github.com/grafana/prometheus-alerting/issues/150)) ([8e320ff](https://github.com/grafana/prometheus-alerting/commit/8e320fff7a20915051115d85413867d2654de112))
* **routes:** use useProduceNewAlertmanagerConfiguration for route mutations ([#147](https://github.com/grafana/prometheus-alerting/issues/147)) ([ad55406](https://github.com/grafana/prometheus-alerting/commit/ad554066bb7b0eeac8cd732bcc54a8233beec462))
* **rule-editor:** consolidate form sections and improve UX ([d7f92ef](https://github.com/grafana/prometheus-alerting/commit/d7f92ef38ead0e3c8e12ad41a94a9ec7d04a912b))
* **rules:** reorganize rule editor utilities and refactor API exports ([22cfff6](https://github.com/grafana/prometheus-alerting/commit/22cfff63bafb2acc315bc696e2dd4e0cdedf341a))


### ✅ Tests

* add hook integration tests for inhibit rules CRUD ([9118b77](https://github.com/grafana/prometheus-alerting/commit/9118b77303a9eed56d76a33c221b3c39d9ceb25a))
* **e2e:** Add Email, Slack and Webhook form tests ([#136](https://github.com/grafana/prometheus-alerting/issues/136)) ([9b04b7b](https://github.com/grafana/prometheus-alerting/commit/9b04b7bdf7fd85999eae48da2586812b877cfe28))
* **e2e:** add receivers e2e tests ([#132](https://github.com/grafana/prometheus-alerting/issues/132)) ([f61cf1f](https://github.com/grafana/prometheus-alerting/commit/f61cf1f1196471653096566a726e5e2048282425))
* **e2e:** add routes e2e tests, fix route id/staleness bugs and cross-version flakiness ([#134](https://github.com/grafana/prometheus-alerting/issues/134)) ([7fcc04a](https://github.com/grafana/prometheus-alerting/commit/7fcc04a6d537771ebe3971ce52ef620cf21d8521))
* **e2e:** add templates e2e tests ([#133](https://github.com/grafana/prometheus-alerting/issues/133)) ([705ee66](https://github.com/grafana/prometheus-alerting/commit/705ee66bfd3ce447d8421ee18a906cb44d108f0c))
* **e2e:** isolate Mimir Alertmanager tenants ([#148](https://github.com/grafana/prometheus-alerting/issues/148)) ([e827e22](https://github.com/grafana/prometheus-alerting/commit/e827e2218ca6f1cd6d9bec4fbd2d301f79eab6bd))
* rewrite Mimir/Loki rule provisioners from shell to Node ([#149](https://github.com/grafana/prometheus-alerting/issues/149)) ([6d5af4a](https://github.com/grafana/prometheus-alerting/commit/6d5af4a886cb711a216bd60bda6225a41a1b754f))


### 🤖 Continuous Integrations

* Add CD workflow ([#138](https://github.com/grafana/prometheus-alerting/issues/138)) ([8047725](https://github.com/grafana/prometheus-alerting/commit/80477251e3ae214c2a1ab7dd75e2b7638f2f6ab0))
* add code coverage PR comment with trend indicator ([#54](https://github.com/grafana/prometheus-alerting/issues/54)) ([320393a](https://github.com/grafana/prometheus-alerting/commit/320393a61c6d39cad67f06ebbf445a6d25ea6fba))
* add release-please for automated version bumps and changelogs ([#152](https://github.com/grafana/prometheus-alerting/issues/152)) ([da49591](https://github.com/grafana/prometheus-alerting/commit/da49591b5814c7257606d929856381561b8a351a))
* add rev-dep workflow with sticky PR comment on failure ([87609e0](https://github.com/grafana/prometheus-alerting/commit/87609e0106541ff628ad02fdc1bf16904317d88b))
* drop third-party actions to satisfy enterprise-only policy ([#67](https://github.com/grafana/prometheus-alerting/issues/67)) ([ec5c5c6](https://github.com/grafana/prometheus-alerting/commit/ec5c5c62f8be550231a3869641f36589ba8dbd7a))
* pin sticky-pull-request-comment action to commit hash ([718c516](https://github.com/grafana/prometheus-alerting/commit/718c516c3c2a06fafd0f4f8af23499976fcbeabb))
* simplify rev-dep workflow, let step fail naturally ([212aac3](https://github.com/grafana/prometheus-alerting/commit/212aac37024fde0f15074148b9bd9bbf28a93257))
* update artifact actions to v7/v8 for Node.js 24 compatibility ([#110](https://github.com/grafana/prometheus-alerting/issues/110)) ([accbcd2](https://github.com/grafana/prometheus-alerting/commit/accbcd23413f0fde1b918f565045bb5a50d12c97))


### 🔧 Chores

* bump @grafana/create-plugin configuration to 6.1.5 ([ccbe89b](https://github.com/grafana/prometheus-alerting/commit/ccbe89bbc4ae4911c5df5cc5a28fc858dc3cc696))
* **ci:** tighten workflow permissions for supply-chain safety ([748c064](https://github.com/grafana/prometheus-alerting/commit/748c064ad3be2c0357e849c90f3d3d09ecb2811c))
* **deps:** bump @grafana/* packages to 13.1.0 ([#131](https://github.com/grafana/prometheus-alerting/issues/131)) ([cc75706](https://github.com/grafana/prometheus-alerting/commit/cc757068753715b95f5be5dd29d5ef165b911e61))
* **deps:** pin immutable@5.1.x via npm override ([291fb02](https://github.com/grafana/prometheus-alerting/commit/291fb02f369a5988baf0ebfe68bedeb2fc96fed9))
* **deps:** update actions/checkout digest to df4cb1c ([#121](https://github.com/grafana/prometheus-alerting/issues/121)) ([750acb9](https://github.com/grafana/prometheus-alerting/commit/750acb92de573daec897fb535d4ac9db273109be))
* **deps:** update dependency @grafana/plugin-e2e to ^2.2.1 ([c1a292b](https://github.com/grafana/prometheus-alerting/commit/c1a292bc1ad0abd1456dc51c8bb72beb7a4ae8e8))
* **deps:** update dependency @grafana/plugin-e2e to ^2.2.1 ([f4f11b8](https://github.com/grafana/prometheus-alerting/commit/f4f11b8ed8caee6d3a3e82a3863aacf0ff42f2bc))
* **deps:** update dependency @hookform/resolvers to v5.4.0 ([#112](https://github.com/grafana/prometheus-alerting/issues/112)) ([80783db](https://github.com/grafana/prometheus-alerting/commit/80783dbaab35af3ba625821c82d35937155f0b6f))
* **deps:** update dependency @playwright/test to ^1.56.0 ([a1a64d8](https://github.com/grafana/prometheus-alerting/commit/a1a64d8c985257eb3cdee643191bb60d19b1ff54))
* **deps:** update dependency @playwright/test to ^1.56.0 ([c4153b1](https://github.com/grafana/prometheus-alerting/commit/c4153b18c1caa7dc72d13d786cb91c5072e2e392))
* **deps:** update dependency @swc/core to ^1.15.33 ([#81](https://github.com/grafana/prometheus-alerting/issues/81)) ([0e9c694](https://github.com/grafana/prometheus-alerting/commit/0e9c694b13aad7a98076842603ade9205f90d87c))
* **deps:** update dependency @types/node to ^20.19.19 ([bc935c5](https://github.com/grafana/prometheus-alerting/commit/bc935c5b7c9b3f8250bc360aa0990de9e3b21bb9))
* **deps:** update dependency @types/node to ^20.19.19 ([c3fb8a7](https://github.com/grafana/prometheus-alerting/commit/c3fb8a7a276300221a111af50767e5feae4109c5))
* **deps:** update dependency @types/testing-library__jest-dom to v5.14.9 ([c387850](https://github.com/grafana/prometheus-alerting/commit/c3878503a3ed95db6973c02d4591b7ea5716b69f))
* **deps:** update dependency @types/testing-library__jest-dom to v5.14.9 ([aed7622](https://github.com/grafana/prometheus-alerting/commit/aed76225974ea76d9dfde7df2d4b8061b5b61574))
* **deps:** update dependency glob to v10.5.0 [security] ([#14](https://github.com/grafana/prometheus-alerting/issues/14)) ([6121f88](https://github.com/grafana/prometheus-alerting/commit/6121f883516768c1fe5fa4ced4a3396dba1ffc2c))
* **deps:** update dependency js-yaml to v4.1.1 [security] ([9bf10c8](https://github.com/grafana/prometheus-alerting/commit/9bf10c8cc2b7295b0a3526d076208864e09a1d8c))
* **deps:** update dependency js-yaml to v4.1.1 [security] ([f4f88e9](https://github.com/grafana/prometheus-alerting/commit/f4f88e93550d0ccb276b9d69e229427177d76d69))
* **deps:** update dependency lodash to v4.17.23 [security] ([#28](https://github.com/grafana/prometheus-alerting/issues/28)) ([8082efb](https://github.com/grafana/prometheus-alerting/commit/8082efb05e530bb2f17ad6fa135537ffd28e2477))
* **deps:** update dependency lodash to v4.18.1 ([#64](https://github.com/grafana/prometheus-alerting/issues/64)) ([98a2f8c](https://github.com/grafana/prometheus-alerting/commit/98a2f8cd12c242ac7a723a957d2c9ab71848d9db))
* **deps:** update dependency typescript to v5.9.3 ([#85](https://github.com/grafana/prometheus-alerting/issues/85)) ([269a021](https://github.com/grafana/prometheus-alerting/commit/269a0217b7ee60ba95ae68df523b250627966c5d))
* **deps:** update dependency vitest to v4 ([#114](https://github.com/grafana/prometheus-alerting/issues/114)) ([5d6f8d5](https://github.com/grafana/prometheus-alerting/commit/5d6f8d5acde8a3ee4e8d3d0ca366c2665687dbdd))
* **deps:** update dependency webpack to ^5.107.0 ([#83](https://github.com/grafana/prometheus-alerting/issues/83)) ([a9a08a9](https://github.com/grafana/prometheus-alerting/commit/a9a08a9080eaed894da6d14117d9cfef1b27b52b))
* **deps:** update dependency webpack to v5.104.1 [security] ([#45](https://github.com/grafana/prometheus-alerting/issues/45)) ([9f77015](https://github.com/grafana/prometheus-alerting/commit/9f77015ac4306b307d0a9246e7af3813dac80365))
* **deps:** update dependency yaml to v2.8.3 ([#62](https://github.com/grafana/prometheus-alerting/issues/62)) ([5f318a3](https://github.com/grafana/prometheus-alerting/commit/5f318a373fcfc729017489600588dade4d82b7c2))
* **deps:** update npm to v11.9.0 [security] ([#48](https://github.com/grafana/prometheus-alerting/issues/48)) ([6ed073b](https://github.com/grafana/prometheus-alerting/commit/6ed073b0540504301f0605ffb23e4d0ac09fc4c4))
* **deps:** update pnpm to v11.5.0 ([#118](https://github.com/grafana/prometheus-alerting/issues/118)) ([5bc18b7](https://github.com/grafana/prometheus-alerting/commit/5bc18b7afd6b57bb97e6be273429d6691af66284))
* exclude test-data .mjs provisioners from rev-dep orphan check ([#151](https://github.com/grafana/prometheus-alerting/issues/151)) ([47c5227](https://github.com/grafana/prometheus-alerting/commit/47c5227153a84e600341d132cdffff6de73c8c1d))
* pin Node to v24.16.0 LTS and add Renovate config ([8bd20f4](https://github.com/grafana/prometheus-alerting/commit/8bd20f4ac8690d59b827f23d5f86c5ab162b281a))
* remove unused CSS/SCSS loaders ([da3bd69](https://github.com/grafana/prometheus-alerting/commit/da3bd6960372b2c2b09c747569357a3bd88b0451))
* replace knip with rev-dep for dependency analysis ([a90120c](https://github.com/grafana/prometheus-alerting/commit/a90120cbbc989bbe040c4fc88ad3a5273ea38689))
* **security:** harden npm supply-chain configuration ([2980a17](https://github.com/grafana/prometheus-alerting/commit/2980a17910c6fd19c2710509278d3b12d53a0532))
* update .config/.cprc.json to version 6.1.5. ([a36ed14](https://github.com/grafana/prometheus-alerting/commit/a36ed14759536f569b8b87b6647f5453e8c3bf87))
* update plugin.json description and keywords ([#119](https://github.com/grafana/prometheus-alerting/issues/119)) ([d324906](https://github.com/grafana/prometheus-alerting/commit/d3249068a840a1fc64589f05a12c8222dd720007))

## Changelog
