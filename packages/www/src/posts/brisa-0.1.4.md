---
title: "Brisa 0.1.4"
created: 11/04/2024
description: "Brisa release notes for version 0.1.4"
author: Aral Roca
author_site: https://x.com/aralroca
cover_image: /images/blog-images/release-0.1.4.webp
---

This release has been based mainly on fixing bugs. This release fixes 11 bugs. Thanks to all contibutors:

- [@gustavocadev](https://github.com/gustavocadev)
- [@aralroca](https://github.com/aralroca)

## Improve req/sec 575%

In this version, we have improved the request per second by 575%. This improvement is due to the optimization of the server and the build process .The best thing is that there is still a lot of room for improvement. This is just a first step.

**Before**

```sh
> wrk -t12 -c400 -d30s http://localhost:3000
Running 30s test @ http://localhost:3000
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   100.81ms   11.35ms 199.92ms   88.45%
    Req/Sec   328.18     28.23   510.00     89.02%
  117868 requests in 30.09s, 47.89MB read
Requests/sec:   3917.06
Transfer/sec:      1.59MB
```

**Now**

```sh
> wrk -t12 -c400 -d30s http://localhost:3000
Running 30s test @ http://localhost:3000
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.82ms    4.45ms  59.72ms   95.47%
    Req/Sec     2.28k   210.97     2.58k    86.69%
  816361 requests in 30.02s, 331.66MB read
Requests/sec:  27198.12
Transfer/sec:     11.05MB
```

## Windows compatibility

In this version, we have fixed some bugs related to Windows compatibility during build process.

## More run-time agnostic

We are preparing Brisa to be more run-time agnostic. This is a first step to make Brisa compatible with other run-times like Cloudflare, Edge and Deno.

## Fix regression on Server Action without JavaScript

We have fixed a regression using [Server Actions](https://brisa.build/building-your-application/data-management/server-actions) on forms when the user has disabled JavaScript. Now is working again.

**And more...**

## What's Changed

- **test**: add test updating signal from multi-calls in effect – [@aralroca](https://github.com/aralroca) in [#590](https://github.com/brisa-build/brisa/pull/590)
- **fix(playground)**: fix back navigation on playground – [@aralroca](https://github.com/aralroca) in [#592](https://github.com/brisa-build/brisa/pull/592)
- **fix(file-system-router)**: fix regex to work on windows – [@aralroca](https://github.com/aralroca) in [#593](https://github.com/brisa-build/brisa/pull/593)
- **fix(cloudflare)**: remove WASM and replace hash to version – [@aralroca](https://github.com/aralroca) in [#594](https://github.com/brisa-build/brisa/pull/594)
- **fix(regression)**: solve indicator to work server action without js – [@aralroca](https://github.com/aralroca) in [#597](https://github.com/brisa-build/brisa/pull/597)
- **chore**: upgrade bun & dependencies – [@aralroca](https://github.com/aralroca) in [#598](https://github.com/brisa-build/brisa/pull/598)
- **fix(serve)**: fix prerender home page – [@aralroca](https://github.com/aralroca) in [#602](https://github.com/brisa-build/brisa/pull/602)
- **fix(windows)**: fix build error with unnormalized brisa dir – [@aralroca](https://github.com/aralroca) in [#603](https://github.com/brisa-build/brisa/pull/603)
- **perf(optimization)**: improve req/sec 575% – [@aralroca](https://github.com/aralroca) in [#604](https://github.com/brisa-build/brisa/pull/604)
- **fix**: solve regex in windows to fix build process – [@aralroca](https://github.com/aralroca) in [#605](https://github.com/brisa-build/brisa/pull/605)
- **fix(windows)**: fix `routeName` check in Windows – [@aralroca](https://github.com/aralroca) and [@gustavocadev](https://github.com/gustavocadev) in [#606](https://github.com/brisa-build/brisa/pull/606)
- **fix(dx)**: improve error feedback on CLI build – [@aralroca](https://github.com/aralroca) in [#607](https://github.com/brisa-build/brisa/pull/607)
- **fix(cloudflare)**: fix process.argv[1] for cloudflare adapter – [@aralroca](https://github.com/aralroca) in [#608](https://github.com/brisa-build/brisa/pull/608)

## New Contributors

- [@gustavocadev](https://github.com/gustavocadev) made their first contribution in [#606](https://github.com/brisa-build/brisa/pull/606)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.3...0.1.4](https://github.com/brisa-build/brisa/compare/0.1.3...0.1.4)
