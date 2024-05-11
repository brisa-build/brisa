# Authorization

Once a user is authenticated, you'll need to ensure the user is allowed to visit certain routes, and perform operations such as mutating data with Server Actions and calling Route Handlers.

## Protecting Routes with Middleware

[Middleware](/building-your-application/routing/middleware) in Brisa helps you control who can access different parts of your website. This is important for keeping areas like the user dashboard protected while having other pages like marketing pages be public. It's recommended to apply Middleware across all routes and specify exclusions for public access.

Here's how to implement Middleware for authentication in Brisa:

`src/middleware.ts`:

```tsx
import type { RequestContext } from "brisa";
import parseCookies from "@/utils/auth/parse-cookies";

export default async function middleware(req: RequestContext) {
  // Early return for assets (no route) and api endpoints
  if (!req.route || req.route.name.startsWith("/api/")) return;

  const cookies = parseCookies(req.headers.get("cookie"));
  const currentUser = cookies.get("currentUser");
  const pathname = req.route.pathname ?? "";

  if (currentUser && !pathname.startsWith("/dashboard")) {
    return new Response("", {
      status: 302,
      headers: {
        Location: new URL("/dashboard", req.url).toString(),
      },
    });
  }

  if (!currentUser && !pathname.startsWith("/login")) {
    return new Response("", {
      status: 302,
      headers: {
        Location: new URL("/login", req.url).toString(),
      },
    });
  }
  // ...
}
```

This example returns a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) for handling redirects early in the request pipeline, making it efficient and centralizing access control.

> [!NOTE]
>
> In Brisa the middleware works in a different way than in many frameworks. If you return nothing or `undefined`, it continues processing the route as if it had not entered the middleware, similar to the `next()` function of many frameworks. Another thing you can return, is a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response), then the middleware cuts and finishes processing the route here. If what you want to do is to modify the response headers that route will have, you have to do it using the [`responseHeaders`](/building-your-application/routing/middleware#on-response) method.

After successful authentication, it's important to manage user navigation based on their roles. For example, an admin user might be redirected to an admin dashboard, while a regular user is sent to a different page. This is important for role-specific experiences and conditional navigation, such as prompting users to complete their profile if needed.

When setting up authorization, it's important to ensure that the main security checks happen where your app accesses or changes data. While Middleware can be useful for initial validation, it should not be the sole line of defense in protecting your data. The bulk of security checks should be performed in the Data Access Layer (DAL).

This approach advocates for consolidating all data access within a dedicated DAL. This strategy ensures consistent data access, minimizes authorization bugs, and simplifies maintenance. To ensure comprehensive security, consider the following key areas:

- **Server Actions**: Implement security checks in server-side processes, especially for sensitive operations.
- **Route Handlers**: Manage incoming requests with security measures to ensure access is limited to authorized users.
- **Data Access Layer (DAL)**: Directly interacts with the database and is crucial for validating and authorizing data transactions. It's vital to perform critical checks within the DAL to secure data at its most crucial interaction point—access or modification.

## Protecting Server Actions

It is important to treat [Server Actions](/building-your-application/data-fetching/server-actions) with the same security considerations as public-facing API endpoints. Verifying user authorization for each action is crucial. Implement checks within Server Actions to determine user permissions, such as restricting certain actions to admin users.

In the example below, we check the user's role before allowing the action to proceed:

```tsx 6-8,13-14,16
import type { RequestContext } from "brisa";
import parseCookies from "@/utils/auth/parse-cookies";
import db from "./lib/db";

async function getSession(req: RequestContext) {
  const cookies = parseCookies(req.headers.get("cookie"));
  const sessionId = cookies.get("sessionId")?.value;
  return sessionId ? await db.findSession(sessionId) : null;
}

export default function AdminDashboard({}, request: RequestContext) {
  async function someAction(e) {
    const session = await getSession(request);
    const userRole = session?.user?.role;

    if (userRole !== "admin") {
      throw new Error(
        "Unauthorized access: User does not have admin privileges.",
      );
    }
    // ...
  }

  return (
    <div>
      <button onClick={someAction}>Run an action</button>
    </div>
  );
}
```

> [!NOTE]
>
> The component `request` param is different when rendered during the SSR than when the action is called. When the action is called, it can be used as the request of the action.

## Protecting Route Handlers

Route Handlers in Brisa play a vital role in managing incoming requests. Just like Server Actions, they should be secured to ensure that only authorized users can access certain functionalities. This often involves verifying the user's authentication status and their permissions.

Here's an example of securing a Route Handler:

`src/api/route.ts`:

```ts 6-8,13
import type { RequestContext } from "brisa";
import parseCookies from "@/utils/auth/parse-cookies";
import db from "./lib/db";

async function getSession(req: RequestContext) {
  const cookies = parseCookies(req.headers.get("cookie"));
  const sessionId = cookies.get("sessionId")?.value;
  return sessionId ? await db.findSession(sessionId) : null;
}

export async function GET(request: RequestContext) {
  // User authentication and role verification
  const session = await getSession(request);

  // Check if the user is authenticated
  if (!session) {
    // User is not authenticated
    return new Response(null, { status: 401 });
  }

  // Check if the user has the 'admin' role
  if (session.user.role !== "admin") {
    // User is authenticated but does not have the right permissions
    return new Response(null, { status: 403 });
  }

  // Data fetching for authorized users
}
```

## Protecting Server Components

Like actions and API routes, you can manage authorization within [Server Components](/docs/app/building-your-application/rendering/server-components). Server Components in Brisa are designed for server-side execution and offer a secure environment for integrating complex logic like authorization. They enable direct access to back-end resources, optimizing performance for data-heavy tasks and enhancing security for sensitive operations.

In Server Components, a common practice is to conditionally render UI elements based on the user's role. This approach enhances user experience and security by ensuring users only access content they are authorized to view.

```tsx 13-15,19
import type { RequestContext } from "brisa";
import parseCookies from "@/utils/auth/parse-cookies";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";
import AccessDenied from "@/components/access-denied";
import db from "./lib/db";

type Props = {
  /* .... */
};

async function getSession(req: RequestContext) {
  const cookies = parseCookies(req.headers.get("cookie"));
  const sessionId = cookies.get("sessionId")?.value;
  return sessionId ? await db.findSession(sessionId) : null;
}

export default async function Dashboard(props: Props, request: RequestContext) {
  const session = await getSession(request);
  const userRole = session?.user?.role; // Assuming 'role' is part of the session object

  if (userRole === "admin") {
    return <AdminDashboard />; // Component for admin users
  } else if (userRole === "user") {
    return <UserDashboard />; // Component for regular users
  } else {
    return <AccessDenied />; // Component shown for unauthorized access
  }
}
```
