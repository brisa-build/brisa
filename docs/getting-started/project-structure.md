---
title: Brisa Project Structure
nav_title: Project Structure
description: A list of folders and files conventions in a Brisa project
---

This page provides an overview of the file and folder structure of a Brisa project.

## `src`-level folders

|                                                                                 |                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------- |
| [`pages`](/building-your-application/routing#pages)                             | Pages Router                                |
| [`api`](/building-your-application/routing#api)                                 | Api Router                                  |
| [`public`](/building-your-application/routing/static-assets)                    | Static assets to be served                  |
| [`middleware`](/building-your-application/configuring/middleware)               | Middleware                                  |
| [`layout`](/building-your-application/configuring/layout)                       | Layout / Layouts                            |
| [`websocket`](/building-your-application/configuring/websocket)                 | Websocket                                   |
| [`i18n`](/building-your-application/configuring/i18n)                           | Internationalization routing & translations |
| [`web-components`](/building-your-application/component-details/web-components) | Client components                           |

## Top-level files

|                                                         |                               |
| ------------------------------------------------------- | ----------------------------- |
|                                                         |                               |
| [`brisa.config.js`](/app/api-reference/brisa-config-js) | Configuration file for Brisa. |

### Special Files in `src/pages`

|                                                                          |                     |                |
| ------------------------------------------------------------------------ | ------------------- | -------------- |
| [`_404`](/pages/building-your-application/routing/custom-error#404-page) | `.js` `.jsx` `.tsx` | 404 Error Page |
| [`_500`](/pages/building-your-application/routing/custom-error#500-page) | `.js` `.jsx` `.tsx` | 500 Error Page |

### Routes

|                                                                                           |                     |             |
| ----------------------------------------------------------------------------------------- | ------------------- | ----------- |
| **Folder convention**                                                                     |                     |             |
| [`index`](/pages/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`folder/index`](/pages/building-your-application/routing/pages-and-layouts#index-routes) | `.js` `.jsx` `.tsx` | Nested page |
| **File convention**                                                                       |                     |             |
| [`index`](/pages/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`file`](/pages/building-your-application/routing/pages-and-layouts)                      | `.js` `.jsx` `.tsx` | Nested page |

### Dynamic Routes

|                                                                                                              |                     |                                  |
| ------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------- |
| **Folder convention**                                                                                        |                     |                                  |
| [`[folder]/index`](/pages/building-your-application/routing/dynamic-routes)                                  | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...folder]/index`](/pages/building-your-application/routing/dynamic-routes#catch-all-segments)            | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...folder]]/index`](/pages/building-your-application/routing/dynamic-routes#optional-catch-all-segments) | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
| **File convention**                                                                                          |                     |                                  |
| [`[file]`](/pages/building-your-application/routing/dynamic-routes)                                          | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...file]`](/pages/building-your-application/routing/dynamic-routes#catch-all-segments)                    | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...file]]`](/pages/building-your-application/routing/dynamic-routes#optional-catch-all-segments)         | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
