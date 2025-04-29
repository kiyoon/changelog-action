# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [v2.0.0] - 2025-04-29
### :sparkles: New Features
- [`e7bc405`](https://github.com/kiyoon/changelog-action/commit/e7bc405e1fcf0a98dae4235ec8b9c0734904590c) - initial import *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`c5d2500`](https://github.com/kiyoon/changelog-action/commit/c5d2500cac46e39fcf02b5f60d3310cbc4586f62) - changelog update *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`3cf79db`](https://github.com/kiyoon/changelog-action/commit/3cf79dbbc9c2343041681314f61f478e24191e4b) - add writeToFile option *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`7c89f7a`](https://github.com/kiyoon/changelog-action/commit/7c89f7ab832998bbd4875c40b8b90a31aac1e398) - add type headers gitmoji option *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`a823d8a`](https://github.com/kiyoon/changelog-action/commit/a823d8ad176c08b3ceffaab28035dcc37be7f43e) - create changelog from 2 tags *(PR [#6](https://github.com/kiyoon/changelog-action/pull/6) by [@sitepark-veltrup](https://github.com/sitepark-veltrup))*
- [`0192e0e`](https://github.com/kiyoon/changelog-action/commit/0192e0ed0553ee53648e187d784ccfdefe9e16b3) - add includeInvalidCommits option *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`f64e045`](https://github.com/kiyoon/changelog-action/commit/f64e045b5e7d73289888b92aa7cf6b9c8443f497) - include referenced issues from PRs *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`01c1b24`](https://github.com/kiyoon/changelog-action/commit/01c1b24b234e079288271046481d408baad64656) - add reverseOrder option to list commits from newer to older *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`a67af14`](https://github.com/kiyoon/changelog-action/commit/a67af14034e62802f8a8fa856a763a76d925df0d) - add support for GHE *(PR [#25](https://github.com/kiyoon/changelog-action/pull/25) by [@anden-dev](https://github.com/anden-dev))*
- [`dba389d`](https://github.com/kiyoon/changelog-action/commit/dba389d510fcf5b8327fe14221b569489dec425d) - add excludeScopes + restrictToTypes options *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`6f10593`](https://github.com/kiyoon/changelog-action/commit/6f105938d7e03ad300949d064c6ccf739e79a3d0) - add changelogFilePath option *(PR [#44](https://github.com/kiyoon/changelog-action/pull/44) by [@kiyoon](https://github.com/kiyoon))*
- [`e561854`](https://github.com/kiyoon/changelog-action/commit/e561854d5acda33a7fd6b8649c0fb6d9a6e463d0) - one tag is enough, precise previous version referring, tag doesn't have to exist *(commit by [@kiyoon](https://github.com/kiyoon))*

### :bug: Bug Fixes
- [`d38977e`](https://github.com/kiyoon/changelog-action/commit/d38977e2d7b820eec68128418127ae1e1d7d78fb) - remove markdown libs *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`6eb7bad`](https://github.com/kiyoon/changelog-action/commit/6eb7bad2faf7bbd33fe04a59ed154653c58108e8) - improve error when tags don't exist *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`de73e51`](https://github.com/kiyoon/changelog-action/commit/de73e51a9227ef957d16ed17b22650582298ca7d) - use context + auto deploy workflow *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`60fe502`](https://github.com/kiyoon/changelog-action/commit/60fe502cb1bbe8d74e3e1ed7540f636506c1d7c9) - precompiled build *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`22fe3e5`](https://github.com/kiyoon/changelog-action/commit/22fe3e5bf2205d243761cbfec6c7d5c90d897051) - ensure newline before footer links *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`fc9dbce`](https://github.com/kiyoon/changelog-action/commit/fc9dbce5d2c2d9f2bb2a8160369c15017fda74e0) - handle commits count over 250 *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`d6cd890`](https://github.com/kiyoon/changelog-action/commit/d6cd890415380a3392c700513b75145485d6c9b8) - compiled action dist *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`7e675e5`](https://github.com/kiyoon/changelog-action/commit/7e675e563d4b3d6acbd444970ef9f8f13485b130) - use github native user handles when writeToFile is false *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`9c907a6`](https://github.com/kiyoon/changelog-action/commit/9c907a6f903e86d4591813cbf8c20b94797c7c70) - handle commits without PR attributions + issue ID mentions *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`66a4bf2`](https://github.com/kiyoon/changelog-action/commit/66a4bf2663a93f4271c97e78ec54859e0b40ff95) - empty changelog warning call *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`af145b6`](https://github.com/kiyoon/changelog-action/commit/af145b6f6d1fa8b857e497c91b3120cec8c1ef36) - move breaking changes section on top + update dependencies *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`94af0c3`](https://github.com/kiyoon/changelog-action/commit/94af0c3dfeae6180da49e87ec06a24880614c081) - handle types in uppercase *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`d47b63a`](https://github.com/kiyoon/changelog-action/commit/d47b63a7f846dd6c4aa803c597a12d413121fd59) - handle commits with no author info *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`cb9cac1`](https://github.com/kiyoon/changelog-action/commit/cb9cac16822feb7033a12db5731511e82f106d5c) - handle related PR issues query failures *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`19f583f`](https://github.com/kiyoon/changelog-action/commit/19f583f53722c093319992282c8efb8a956efd64) - action.yml output name *(PR [#30](https://github.com/kiyoon/changelog-action/pull/30) by [@cupofme](https://github.com/cupofme))*
- [`1fabc7b`](https://github.com/kiyoon/changelog-action/commit/1fabc7b0c6581d93c398246a856f084fb17cd9eb) - omit empty type exclusions *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`4a2c34a`](https://github.com/kiyoon/changelog-action/commit/4a2c34a1a8fcfa9e48e61960aad0affc15066393) - incorrect related issue URL in file-based changelog output *(commit by [@NGPixel](https://github.com/NGPixel))*
- [`6d71e09`](https://github.com/kiyoon/changelog-action/commit/6d71e098526ee17bae963f058d34cd763378337f) - add end of file return to changelog file *(PR [#56](https://github.com/kiyoon/changelog-action/pull/56) by [@sjpalf](https://github.com/sjpalf))*

[v2.0.0]: https://github.com/kiyoon/changelog-action/compare/8bf61f458e297dc44dd435bbcd31daa603351356...v2.0.0
