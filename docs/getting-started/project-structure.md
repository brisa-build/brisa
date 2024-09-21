---
nav_title: Project Structure
description: A list of folders and files conventions in a Brisa project
---

# Brisa Project Structure

This page provides an overview of the file and folder structure of a Brisa project.

## `src`-level folders

|                                                                                  |                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------- |
| [`pages`](/building-your-application/routing/pages-and-layouts)                  | Pages Router                                |
| [`api`](/building-your-application/routing/api-routes)                           | Api Router                                  |
| [`public`](/building-your-application/routing/static-assets)                     | Static assets to be served                  |
| [`middleware`](/building-your-application/routing/middleware)                    | Middleware                                  |
| [`layout`](/building-your-application/routing/pages-and-layouts#layout)          | Layout / Layouts                            |
| [`websocket`](/building-your-application/routing/websockets)                     | Websocket                                   |
| [`i18n`](/building-your-application/routing/internationalization)                | Internationalization routing & translations |
| [`web-components`](/building-your-application/components-details/web-components) | Client components                           |

## Top-level files

|                                                                             |                               |
| --------------------------------------------------------------------------- | ----------------------------- |
|                                                                             |                               |
| [`brisa.config.js`](/building-your-application/configuring/brisa-config-js) | Configuration file for Brisa. |

### Special Files in `src/pages`

|                                                                    |                     |                |
| ------------------------------------------------------------------ | ------------------- | -------------- |
| [`_404`](/building-your-application/routing/custom-error#404-page) | `.js` `.jsx` `.tsx` | 404 Error Page |
| [`_500`](/building-your-application/routing/custom-error#500-page) | `.js` `.jsx` `.tsx` | 500 Error Page |

### Routes

|                                                                                     |                     |             |
| ----------------------------------------------------------------------------------- | ------------------- | ----------- |
| **Folder convention**                                                               |                     |             |
| [`index`](/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`folder/index`](/building-your-application/routing/pages-and-layouts#index-routes) | `.js` `.jsx` `.tsx` | Nested page |
| **File convention**                                                                 |                     |             |
| [`index`](/building-your-application/routing/pages-and-layouts#index-routes)        | `.js` `.jsx` `.tsx` | Home page   |
| [`file`](/building-your-application/routing/pages-and-layouts)                      | `.js` `.jsx` `.tsx` | Nested page |

### Dynamic Routes

|                                                                                                        |                     |                                  |
| ------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------- |
| **Folder convention**                                                                                  |                     |                                  |
| [`[folder]/index`](/building-your-application/routing/dynamic-routes)                                  | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...folder]/index`](/building-your-application/routing/dynamic-routes#catch-all-segments)            | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...folder]]/index`](/building-your-application/routing/dynamic-routes#optional-catch-all-segments) | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
| **File convention**                                                                                    |                     |                                  |
| [`[file]`](/building-your-application/routing/dynamic-routes)                                          | `.js` `.jsx` `.tsx` | Dynamic route segment            |
| [`[...file]`](/building-your-application/routing/dynamic-routes#catch-all-segments)                    | `.js` `.jsx` `.tsx` | Catch-all route segment          |
| [`[[...file]]`](/building-your-application/routing/dynamic-routes#optional-catch-all-segments)         | `.js` `.jsx` `.tsx` | Optional catch-all route segment |
