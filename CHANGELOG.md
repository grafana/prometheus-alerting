# Changelog

## [1.6.1](https://github.com/grafana/prometheus-alerting/compare/v1.6.0...v1.6.1) (2026-09-25)


### 🐛 Bug Fixes

* **alertmanager:** open the Alertmanager named in ?alertmanager= ([#321](https://github.com/grafana/prometheus-alerting/issues/321)) ([c651caa](https://github.com/grafana/prometheus-alerting/commit/c651caa567c9eec9b982effc97ce28973ab2ecda))
* **rules:** move a rule when its group or namespace changes ([#314](https://github.com/grafana/prometheus-alerting/issues/314)) ([03e2cc7](https://github.com/grafana/prometheus-alerting/commit/03e2cc7f23922f7c379305eac999bba1260a39bf))
* **time-intervals:** don't delete a time interval routes still use ([#315](https://github.com/grafana/prometheus-alerting/issues/315)) ([33fcd5d](https://github.com/grafana/prometheus-alerting/commit/33fcd5db32c43aecd173b45041803fd57bdbefd9))


### 📝 Documentation

* **rules:** trim the rule editor README and fix the recording rule placeholder ([#320](https://github.com/grafana/prometheus-alerting/issues/320)) ([822128f](https://github.com/grafana/prometheus-alerting/commit/822128f9aac03a815b9e23cee100f27cdb945185))


### 🔧 Chores

* **dev:** split docker-compose services into included files ([#317](https://github.com/grafana/prometheus-alerting/issues/317)) ([fd0d068](https://github.com/grafana/prometheus-alerting/commit/fd0d0687fcd8ee8145e338d923ab839fb6740b5b))

## [1.6.0](https://github.com/grafana/prometheus-alerting/compare/v1.5.0...v1.6.0) (2026-09-23)


### 🎉 Features

* **alertmanager:** edit the configuration as YAML ([#268](https://github.com/grafana/prometheus-alerting/issues/268)) ([64016ea](https://github.com/grafana/prometheus-alerting/commit/64016ea42dfe3331c19f72359fcb7b80a4c37d63))
* **alerts:** silence an alert instance from the instance itself ([#248](https://github.com/grafana/prometheus-alerting/issues/248)) ([5561347](https://github.com/grafana/prometheus-alerting/commit/556134710a66383f54ea0f9010590b4581a25497))
* **routes:** edit active time intervals ([#269](https://github.com/grafana/prometheus-alerting/issues/269)) ([c92d723](https://github.com/grafana/prometheus-alerting/commit/c92d723559dcd7a00536b5d28d732da0accb7714))
* **rules:** edit keep_firing_for in the rule editor ([#212](https://github.com/grafana/prometheus-alerting/issues/212)) ([ee9f916](https://github.com/grafana/prometheus-alerting/commit/ee9f9169c75bdfc8e092aa5c9cd460909df263ca))
* **rules:** filter rules by health ([#310](https://github.com/grafana/prometheus-alerting/issues/310)) ([2c9f003](https://github.com/grafana/prometheus-alerting/commit/2c9f0036e7e55134a4ac3f69266b89dcc84783db))
* **rules:** validate recording rule names before they hit the ruler ([#228](https://github.com/grafana/prometheus-alerting/issues/228)) ([c6d0d8b](https://github.com/grafana/prometheus-alerting/commit/c6d0d8bf8a7e54b3689a39bb7d9218aca37430ef))
* **rules:** view namespace rules as YAML ([#249](https://github.com/grafana/prometheus-alerting/issues/249)) ([5bd93e2](https://github.com/grafana/prometheus-alerting/commit/5bd93e2ad4390468642e4a2333776b1ac97a828d))


### 🐛 Bug Fixes

* **alertmanager:** keep the global config block on write ([#210](https://github.com/grafana/prometheus-alerting/issues/210)) ([c4cf04d](https://github.com/grafana/prometheus-alerting/commit/c4cf04dc329dfd515cea89ca8a238bed6c6ca9d0))
* **alerts:** deduplicate state counters ([#309](https://github.com/grafana/prometheus-alerting/issues/309)) ([24edf6a](https://github.com/grafana/prometheus-alerting/commit/24edf6aae86ed6019b3d731ec24c0a2e47b53e19))
* error on invalid label matcher instead of silently ignoring it ([#277](https://github.com/grafana/prometheus-alerting/issues/277)) ([af928f2](https://github.com/grafana/prometheus-alerting/commit/af928f2f070699a04906d402a945d81fc648634e))
* **inhibit-rules:** support multiple structured matchers ([#285](https://github.com/grafana/prometheus-alerting/issues/285)) ([dba922d](https://github.com/grafana/prometheus-alerting/commit/dba922d4147abe657ca4d8e6b21b9812b3ef965d))
* **receivers:** Add authorization block for Webex  ([#227](https://github.com/grafana/prometheus-alerting/issues/227)) ([2637508](https://github.com/grafana/prometheus-alerting/commit/2637508f44939908bb3e9b180c62d945035bac4c))
* **routes:** accept valid durations when editing a route ([#216](https://github.com/grafana/prometheus-alerting/issues/216)) ([44e4f25](https://github.com/grafana/prometheus-alerting/commit/44e4f251bd1d203f159c5820bd992e330b8d4ce6))
* **routes:** correct group and repeat interval descriptions ([#209](https://github.com/grafana/prometheus-alerting/issues/209)) ([62a513a](https://github.com/grafana/prometheus-alerting/commit/62a513a6be5d451fecf08db20dce7763516d3668))
* **routes:** correct matching alert instance counts ([#299](https://github.com/grafana/prometheus-alerting/issues/299)) ([053000e](https://github.com/grafana/prometheus-alerting/commit/053000e2265fffe403189170c3647ceb600f485a))
* **rules:** clarify rule search loading state ([#251](https://github.com/grafana/prometheus-alerting/issues/251)) ([66075bf](https://github.com/grafana/prometheus-alerting/commit/66075bf01d4605464f2ea96d0886c24631cd66df))
* **rules:** flag duplicate label and annotation keys ([#292](https://github.com/grafana/prometheus-alerting/issues/292)) ([9dc943b](https://github.com/grafana/prometheus-alerting/commit/9dc943ba5f1978096df66aae425adfae5e09a0fc))
* **rules:** harden search parsing and cancel stale sidebar edits ([#305](https://github.com/grafana/prometheus-alerting/issues/305)) ([6920453](https://github.com/grafana/prometheus-alerting/commit/69204539d8f9192b7eb0239cdcc4545320e2ab2c))
* **rules:** hide pending period for recording rules ([#273](https://github.com/grafana/prometheus-alerting/issues/273)) ([d6c59ed](https://github.com/grafana/prometheus-alerting/commit/d6c59ed4faa3e2d8fd8b8a272173974749186a03))
* **rules:** honour the data source's manageAlerts toggle ([#224](https://github.com/grafana/prometheus-alerting/issues/224)) ([5ee5723](https://github.com/grafana/prometheus-alerting/commit/5ee57236bebf15a4e02b3b8c6469b6387efdf8f2))
* **rules:** improve list and details behavior ([#233](https://github.com/grafana/prometheus-alerting/issues/233)) ([a0bc5bb](https://github.com/grafana/prometheus-alerting/commit/a0bc5bba6b22c9ca26eade88482116ae4372d8d5))
* **rules:** keep Mimir rule-group settings on write ([#213](https://github.com/grafana/prometheus-alerting/issues/213)) ([9899329](https://github.com/grafana/prometheus-alerting/commit/9899329d406dcb4c01e6dc19fe7a3bec09b4d066))
* **rules:** make federated rule groups read-only ([#222](https://github.com/grafana/prometheus-alerting/issues/222)) ([d1695e7](https://github.com/grafana/prometheus-alerting/commit/d1695e7b9b588bab0f2ac15553254d6b22f01348))
* **rules:** normalize durations when hashing queries ([#296](https://github.com/grafana/prometheus-alerting/issues/296)) ([083b255](https://github.com/grafana/prometheus-alerting/commit/083b255f9bea6e445e9ccfb7c198f0965dc12437))
* **rules:** show not found for a malformed rule identifier ([#265](https://github.com/grafana/prometheus-alerting/issues/265)) ([faf5474](https://github.com/grafana/prometheus-alerting/commit/faf5474ca9ac85d017ea7c37cc54151ecba6fe4c))
* **rules:** show the plugin logo when a data source's application is unknown ([#196](https://github.com/grafana/prometheus-alerting/issues/196)) ([323780d](https://github.com/grafana/prometheus-alerting/commit/323780d9b6c72ba0bb579afcd906f18d07da57d5))
* **rules:** show what the Ruler rejected instead of "[object Object]" ([#225](https://github.com/grafana/prometheus-alerting/issues/225)) ([951b57f](https://github.com/grafana/prometheus-alerting/commit/951b57f56503e325081b46d966cfba3155a11343))
* **security/high/:** update dependency js-yaml to v4.3.2 [security] ([#275](https://github.com/grafana/prometheus-alerting/issues/275)) ([579a444](https://github.com/grafana/prometheus-alerting/commit/579a444cc02192e4b55cbde239a8372eeee91d02))
* **security/medium/:** update dependency vitest to v4.1.11 [security] ([#276](https://github.com/grafana/prometheus-alerting/issues/276)) ([dec1b73](https://github.com/grafana/prometheus-alerting/commit/dec1b731e40731360ccd0694351652e2763aa0f7))
* **security:** override qs to a patched version ([#278](https://github.com/grafana/prometheus-alerting/issues/278)) ([cff884c](https://github.com/grafana/prometheus-alerting/commit/cff884c50007b1d5462dfab8fc093278673daa5e))
* **security:** overrides maintenance ([#280](https://github.com/grafana/prometheus-alerting/issues/280)) ([d409c1e](https://github.com/grafana/prometheus-alerting/commit/d409c1eacf0711254528b4c9808314659fc2bae7))
* **templates:** validate Go template syntax before saving ([#282](https://github.com/grafana/prometheus-alerting/issues/282)) ([618b3ed](https://github.com/grafana/prometheus-alerting/commit/618b3edd1779e1cf0f73a83891581e873088b906))
* **time-intervals:** keep every interval and time range on edit ([#211](https://github.com/grafana/prometheus-alerting/issues/211)) ([66b1257](https://github.com/grafana/prometheus-alerting/commit/66b1257d20c447f90200faca16a1a7eb9c0a64c1))
* validate evaluation intervals client-side ([#279](https://github.com/grafana/prometheus-alerting/issues/279)) ([f7871a2](https://github.com/grafana/prometheus-alerting/commit/f7871a2b0d53f322add7490c27dfed06a1b4b8aa))


### 📝 Documentation

* add docs/sources scaffold, setup guide, and local preview tooling ([#202](https://github.com/grafana/prometheus-alerting/issues/202)) ([f76e773](https://github.com/grafana/prometheus-alerting/commit/f76e773c6c1857023468412d7c99515ce2bc4e59))
* add the Configure alert rules section ([#204](https://github.com/grafana/prometheus-alerting/issues/204)) ([0fa638e](https://github.com/grafana/prometheus-alerting/commit/0fa638e7698f3a185143e997d40b14dddc134b5f))
* add the Configure notifications section ([#205](https://github.com/grafana/prometheus-alerting/issues/205)) ([00b78f7](https://github.com/grafana/prometheus-alerting/commit/00b78f76f19ec2646f7efc046bc55f187edd07d8))
* add the Guides and Examples sections ([#207](https://github.com/grafana/prometheus-alerting/issues/207)) ([7d59d62](https://github.com/grafana/prometheus-alerting/commit/7d59d62890bcca135bc3000bbc8f00e6c9d99241))
* add the Introduction section ([#203](https://github.com/grafana/prometheus-alerting/issues/203)) ([6cc361d](https://github.com/grafana/prometheus-alerting/commit/6cc361d70ae6b62ec2637c8989807fe2660a6245))
* add the Monitor alerts section ([#206](https://github.com/grafana/prometheus-alerting/issues/206)) ([dfa59ce](https://github.com/grafana/prometheus-alerting/commit/dfa59cee5d443f9c1aee9025f95c12a16110ad6f))
* **adr:** record why namespace YAML needs a Ruler API ([#266](https://github.com/grafana/prometheus-alerting/issues/266)) ([0c322af](https://github.com/grafana/prometheus-alerting/commit/0c322aff2af4d6eb109ba8cedac89d677135d0b8))
* cut the em dash density ([#217](https://github.com/grafana/prometheus-alerting/issues/217)) ([b483a09](https://github.com/grafana/prometheus-alerting/commit/b483a094aefe875cb573fab2bfaca2104340beef))
* fix Writer's Toolkit compliance issues ([#215](https://github.com/grafana/prometheus-alerting/issues/215)) ([f7cf7d2](https://github.com/grafana/prometheus-alerting/commit/f7cf7d28bba6a545d498e20de234d8cf7bc648d4))
* **security:** align SECURITY_POSTURE with actual mise settings ([#271](https://github.com/grafana/prometheus-alerting/issues/271)) ([23dbf38](https://github.com/grafana/prometheus-alerting/commit/23dbf388a53a3d349ad24fab0764a141623a21aa))


### ♻️ Code Refactoring

* **alerts:** flatten the alert drawer's detail rows ([#264](https://github.com/grafana/prometheus-alerting/issues/264)) ([672bebd](https://github.com/grafana/prometheus-alerting/commit/672bebd7bd1ca5332e719ce29ff8a4e5d0f90c43))
* **receivers:** add Mimir-first typed receiver forms ([#232](https://github.com/grafana/prometheus-alerting/issues/232)) ([2391f49](https://github.com/grafana/prometheus-alerting/commit/2391f4959fca85c083266b3282b7d5b6be44f882))
* **rules:** add a rules-source flavor seam ([#197](https://github.com/grafana/prometheus-alerting/issues/197)) ([90462fe](https://github.com/grafana/prometheus-alerting/commit/90462fe48f99a334c3f3388dc6c2ddf1c7824e58))


### ⚡ Performance Improvements

* **routes:** optimize instance match counting ([#297](https://github.com/grafana/prometheus-alerting/issues/297)) ([7be10a3](https://github.com/grafana/prometheus-alerting/commit/7be10a3684e6feb61fc03e13ada6a26f60abfcd2))


### ✅ Tests

* clean up noisy console output in the test suite ([#200](https://github.com/grafana/prometheus-alerting/issues/200)) ([3090722](https://github.com/grafana/prometheus-alerting/commit/30907226fea15f4ec608e8ccbbf4bfc65a79d880))
* **e2e:** cover all Alertmanager receiver forms ([#234](https://github.com/grafana/prometheus-alerting/issues/234)) ([b897981](https://github.com/grafana/prometheus-alerting/commit/b89798179925cff375f31026f5acff42dd6cbb23))
* **e2e:** wait for the rule editor to close before reading the ruler ([#254](https://github.com/grafana/prometheus-alerting/issues/254)) ([4e7e870](https://github.com/grafana/prometheus-alerting/commit/4e7e870523689177f4602a745d7082f42c7081d7))


### 🤖 Continuous Integrations

* bump the release-please action to v2.0.2 ([#221](https://github.com/grafana/prometheus-alerting/issues/221)) ([e27ac1d](https://github.com/grafana/prometheus-alerting/commit/e27ac1d5e92be6e82610a198023d8add4f2803c0))
* let the PR impact post job read the repository ([#284](https://github.com/grafana/prometheus-alerting/issues/284)) ([8165f70](https://github.com/grafana/prometheus-alerting/commit/8165f7018ed45d2843a86bc1c3aebd91e0562969))
* pin the mise version so CI stops 404ing ([#270](https://github.com/grafana/prometheus-alerting/issues/270)) ([609f35d](https://github.com/grafana/prometheus-alerting/commit/609f35d66110a0d13d050477c5881b0b8ac380f8))
* post PR impact's inline comments as a round, not a running list ([#295](https://github.com/grafana/prometheus-alerting/issues/295)) ([88f1667](https://github.com/grafana/prometheus-alerting/commit/88f1667ccaa5e8499c2ae106652190ee131ca4bd))
* rate a PR once, and fold the earlier rounds away ([#311](https://github.com/grafana/prometheus-alerting/issues/311)) ([3c1f812](https://github.com/grafana/prometheus-alerting/commit/3c1f81283575e3ec606f5ed9bea0a8d10e15dbed))
* rate PR impact and mark what to review first ([#272](https://github.com/grafana/prometheus-alerting/issues/272)) ([c15f536](https://github.com/grafana/prometheus-alerting/commit/c15f5363edd094d80ede3301b9df3bab8c3a1992))
* remove create-plugin-update workflow ([#195](https://github.com/grafana/prometheus-alerting/issues/195)) ([7b7b89a](https://github.com/grafana/prometheus-alerting/commit/7b7b89a57b287a1c499b7d87b73131aad6ef38d2))
* rename workflows for clarity and fix create-plugin-update ([#193](https://github.com/grafana/prometheus-alerting/issues/193)) ([e4db394](https://github.com/grafana/prometheus-alerting/commit/e4db3940bdcfc27135e8d0366df1ec19ff73c30a))


### 🔧 Chores

* **build:** derive the compile target from browserslist ([#219](https://github.com/grafana/prometheus-alerting/issues/219)) ([463682f](https://github.com/grafana/prometheus-alerting/commit/463682f19c4bd661efa63e2c54b85a30fb81f947))
* **deps:** bump Node to 24.21.0, pnpm to 12.4.2, lefthook and trufflehog ([#307](https://github.com/grafana/prometheus-alerting/issues/307)) ([259e9b6](https://github.com/grafana/prometheus-alerting/commit/259e9b6fc0027f70d6ed0897008b76532c1e2bc4))
* **deps:** resolve high-severity audit advisories ([#267](https://github.com/grafana/prometheus-alerting/issues/267)) ([c4c3497](https://github.com/grafana/prometheus-alerting/commit/c4c3497708445fac5aee199307084fd353d1d68e))
* provision a Mimir Alertmanager data source for local development ([#220](https://github.com/grafana/prometheus-alerting/issues/220)) ([cb863bd](https://github.com/grafana/prometheus-alerting/commit/cb863bdc30b8f436aa61e2b2f8a0564363ed9410))
* **rules:** provision a rule that always fails evaluation ([#308](https://github.com/grafana/prometheus-alerting/issues/308)) ([c95e461](https://github.com/grafana/prometheus-alerting/commit/c95e4619c2058492ac4e7a8d62244d1b927c6e88))
* upgrade Mimir to 3.2.0 in local test stack ([#253](https://github.com/grafana/prometheus-alerting/issues/253)) ([183d18d](https://github.com/grafana/prometheus-alerting/commit/183d18d886b33b39b25887e0c25b3618a245dbc9))

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
