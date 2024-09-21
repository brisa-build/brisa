# Authentication

User verification confirms the user's identity, occurring during login via credentials like a username-password combination or through a service such as Google. It focuses on validating that users are indeed who they claim to be, safeguarding both user data and the application from unauthorized access or fraudulent activities.

## Authentication Strategies

Contemporary web applications commonly employ various authentication approaches:

1. **OAuth/OpenID Connect (OIDC)**: Facilitates third-party access without disclosing user credentials, ideal for social media logins and Single Sign-On (SSO) solutions. It introduces an identity layer through OpenID Connect.
2. **Credentials-based login (Email + Password)**: A standard choice where users log in using email and password, familiar and straightforward to implement, necessitating robust security measures against threats like phishing.
3. **Passwordless/Token-based authentication**: Use email magic links or SMS one-time codes for secure, password-free access. Popular for its convenience and heightened security, though reliant on user email or phone availability.
4. **Passkeys/WebAuthn**: Utilizes site-specific cryptographic credentials, offering strong protection against phishing. While secure, its newness might pose implementation challenges.

Choosing an authentication approach should align with your application's specific needs, user interface considerations, and security goals.

## Implementing Authentication

In this section, we'll explore the process of adding basic email-password authentication to a web application. While this method provides a fundamental level of security, it's worth considering more advanced options like OAuth or passwordless logins for enhanced protection against common security threats. The authentication flow we'll discuss is as follows:

1. The user submits their credentials through a login form.
2. The form calls a Server Action.
3. Upon successful verification, the process is completed, indicating the user's successful authentication.
4. If verification is unsuccessful, an error message is shown.

Consider a server component with login form where users can input their credentials:

```tsx 9-10
import { navigate, type RequestContext } from "brisa";
import { rerenderInAction } from "brisa/server";
import signIn from "@/utils/auth/sign-in";

export default function LoginPage({}, request: RequestContext) {
  const errorMsg = request.store.get("auth-error");

  async function authenticate(e) {
    const email = e.formData.get("email");
    const password = e.formData.get("password");
    const success = await signIn(email, password);

    if (success) navigate("/admin");

    request.store.set("auth-error", "Invalid credentials");
    rerenderInAction({ type: "page" });
  }

  return (
    <form onSubmit={authenticate}>
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
      {errorMsg && <p>{errorMsg}</p>}
    </form>
  );
}
```

The form above has two input fields for capturing the user's `email` and `password`. On submission, it calls the `authenticate` Server Action. You can then call your Authentication Provider's API in the Server Action to handle authentication:

```tsx
const success = await signIn(email, password);
```

In this code, the `signIn` method checks the credentials against stored user data.
After the authentication provider processes the credentials, there are two possible outcomes:

- **Successful Authentication**: This outcome implies that the login was successful. Further actions, such as accessing protected routes and fetching user information, can then be initiated.
- **Failed Authentication**: In cases where the credentials are incorrect or an error is encountered, the function returns a corresponding error message to indicate the authentication failure.

Finally, you can `navigate` to another page or use the request `store` to save form errors, and use `rerenderInAction` to render these errors on the form:

```tsx
if (success) navigate("/admin");

request.store.set("auth-error", "Invalid credentials");
rerenderInAction({ type: "page" });
```

> [!IMPORTANT]
>
> Both `navigate` and `rerenderInAction` throw an exception returning a [Never](https://www.typescriptlang.org/docs/handbook/basic-types.html#never) type, therefore the code after is not executed so there is no need to put an `else` conditional. It is important to keep this in mind because if it is put in a `try-catch` they would stop working unless from the catch you throw again these actions.
