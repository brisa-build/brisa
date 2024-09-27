import { dangerHTML } from 'brisa';

export default function Layout({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Brisa - View Transitions</title>
      </head>
      <body class="bg-gradient-to-tl via-transparent from-gray-500/5">
        <main class="relative max-w-6xl min-h-screen mx-auto py-6 lg:pt-10 px-4 pb-20">
          {children}
        </main>

        <style>
          {dangerHTML(`
      html {
        scroll-behavior: smooth;
      }
      body {
        background-color: theme(colors.gray.50);
      }
      .animate-in {
        animation: animate-in 0.5s ease-in-out;
      }
      /* Firefox */
      * {
        scrollbar-width: auto;
        scrollbar-color: #c7c7c7 #ededed;
      }

      /* Chrome, Edge, and Safari */
      *::-webkit-scrollbar {
        width: 15px;
      }

      *::-webkit-scrollbar-track {
        background: #ededed;
      }

      *::-webkit-scrollbar-thumb {
        background-color: #c7c7c7;
        border-radius: 5px;
        border: 2px solid #ffffff;
      }
      @keyframes animate-in {
        0% {
          opacity: 0;
          transform: translateY(1rem);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      `)}
        </style>
      </body>
    </html>
  );
}
