---
title: Brisa Project Structure
nav_title: Project Structure
description: A list of folders and files conventions in a Brisa project
---

This page provides an overview of the file and folder structure of a Brisa project.

## `src`-level folders

|                                                                                      |                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------- |
| [`pages`](/docs/building-your-application/routing#pages)                             | Pages Router                                |
| [`api`](/docs/building-your-application/routing#api)                                 | Api Router                                  |
| [`public`](/docs/building-your-application/optimizing/static-assets)                 | Static assets to be served                  |
| [`middleware`](/docs/building-your-application/configuring/middleware)               | Middleware                                  |
| [`layout`](/docs/building-your-application/configuring/layout)                       | Layout / Layouts                            |
| [`websocket`](/docs/building-your-application/configuring/websocket)                 | Websocket                                   |
| [`i18n`](/docs/building-your-application/configuring/i18n)                           | Internationalization routing & translations |
| [`web-components`](/docs/building-your-application/component-details/web-components) | Client components                           |

## Top-level files

|                                                              |                               |
| ------------------------------------------------------------ | ----------------------------- |
|                                                              |                               |
| [`brisa.config.js`](/docs/app/api-reference/brisa-config-js) | Configuration file for Brisa. |

### Special Files in `src/pages`

|                                                                               |                     |                |
| ----------------------------------------------------------------------------- | ------------------- | -------------- |
| [`_404`](/docs/pages/building-your-application/routing/custom-error#404-page) | `.js` `.jsx` `.tsx` | 404 Error Page |
| [`_500`](/docs/pages/building-your-application/routing/custom-error#500-page) | `.js` `.jsx` `.tsx` | 500 Error Page |

### Routes

|                                                                                                |                     |             |
| ---------------------------------------------------------------------------------------------- | ------------------- | ----------- |
| **Folder convention**                                                                          |                     |             |
| [`index`](/docs/pages/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`folder/index`](/docs/pages/building-your-application/routing/pages-and-layouts#index-routes) | `.js` `.jsx` `.tsx` | Nested page |
| **File convention**                                                                            |                     |             |
| [`index`](/docs/pages/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`file`](/docs/pages/building-your-application/routing/pages-and-layouts)                      | `.js` `.jsx` `.tsx` | Nested page |

### Dynamic Routes

|                                                                                                                   |                     |                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------- |
| **Folder convention**                                                                                             |                     |                                  |
| [`[folder]/index`](/docs/pages/building-your-application/routing/dynamic-routes)                                  | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...folder]/index`](/docs/pages/building-your-application/routing/dynamic-routes#catch-all-segments)            | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...folder]]/index`](/docs/pages/building-your-application/routing/dynamic-routes#optional-catch-all-segments) | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
| **File convention**                                                                                               |                     |                                  |
| [`[file]`](/docs/pages/building-your-application/routing/dynamic-routes)                                          | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...file]`](/docs/pages/building-your-application/routing/dynamic-routes#catch-all-segments)                    | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...file]]`](/docs/pages/building-your-application/routing/dynamic-routes#optional-catch-all-segments)         | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
