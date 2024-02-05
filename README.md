# Brisa _(experimental yet)_

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

## Who we are?

Brisa presents itself as **your new JavaScript web framework**, offering a streamlined development experience.

Tired of juggling numerous tools for various tasks? Fed up with dependencies on Virtual DOM and frequent rerenders? Struggling with `"use server"` and `"use client"`? Yearning for seamless integration of i18n (routing and translations) across your framework, accessible with ease in both server and client components? Do you desire a smooth transition of your web application into a desktop, Android, or iOS app?

Brisa addresses these challenges as a framework built on top of [Bun](https://bun.sh/). With build and test processes completed in under 1 second, leveraging Bun's API propels your server to handle more than 66,000 requests per second.

Brisa defaults to **streaming** rendering and **server components** but also allows the use of **web components** written in JSX and reactive **signals**. Brisa is fully reactive, and the reduced reliance on web components is possible because, thanks to the inspiration of HTMX, Brisa enables event capture in server components, facilitating a **reactive server**, without the need for you to create API endpoints or write client code. But if you need **API endpoints**, **middleware**, **WebSockets**, and **layouts** Brisa makes it all easy.

By default, the pages have a size of **0 bytes**, with Brisa occupying a mere 3kb if web components are utilized.

Should you choose to forego the server, Brisa empowers you to export your web application to **static** files or generate executable files for **desktop**, **Android**, or **iOS** apps. Furthermore, the i18n functionality seamlessly extends to all output types.

Develop applications swiftly with an enhanced developer experience (DX) and improved performance across both web and server environments. Explore our documentation and experiment with our playground to enrich your learning experience and embark on your next project confidently.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://aralroca.com"><img src="https://avatars.githubusercontent.com/u/13313058?v=4?s=100" width="100px;" alt="Aral Roca Gomez"/><br /><sub><b>Aral Roca Gomez</b></sub></a><br /><a href="https://github.com/aralroca/brisa/commits?author=aralroca" title="Code">💻</a> <a href="https://github.com/aralroca/brisa/commits?author=aralroca" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://amatiasq.com"><img src="https://avatars.githubusercontent.com/u/1533589?v=4?s=100" width="100px;" alt="A. Matías Quezada"/><br /><sub><b>A. Matías Quezada</b></sub></a><br /><a href="https://github.com/aralroca/brisa/commits?author=amatiasq" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
