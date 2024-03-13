---
title: Authentication
description: Learn how to implement authentication in Brisa covering best practices, securing routes, authorization techniques, and session management.
---

To incorporate authentication in Brisa, acquaint yourself with three fundamental principles:

- **[Authentication](#authentication) (Identity Verification)** ensures the user's claimed identity. It mandates users to validate their identity with possessions like a username and password.
- **[Session Tracking](#session-tracking)** monitors the user's status (e.g., logged in) across various requests.
- **[Authorization](#authorization)** determines the application areas accessible to the user..

This page illustrates the utilization of Brisa features to implement prevalent patterns in authentication, authorization, and session management. This empowers you to select optimal solutions tailored to your application's requirements.

## Authentication

User verification confirms the user's identity, occurring during login via credentials like a username-password combination or through a service such as Google. It focuses on validating that users are indeed who they claim to be, safeguarding both user data and the application from unauthorized access or fraudulent activities.

### Authentication Strategies

Contemporary web applications commonly employ various authentication approaches:

1. **OAuth/OpenID Connect (OIDC)**: Facilitates third-party access without disclosing user credentials, ideal for social media logins and Single Sign-On (SSO) solutions. It introduces an identity layer through OpenID Connect.
2. **Credentials-based login (Email + Password)**: A standard choice where users log in using email and password, familiar and straightforward to implement, necessitating robust security measures against threats like phishing.
3. **Passwordless/Token-based authentication**: Use email magic links or SMS one-time codes for secure, password-free access. Popular for its convenience and heightened security, though reliant on user email or phone availability.
4. **Passkeys/WebAuthn**: Utilizes site-specific cryptographic credentials, offering strong protection against phishing. While secure, its newness might pose implementation challenges.

Choosing an authentication approach should align with your application's specific needs, user interface considerations, and security goals.

### Implementing Authentication

TODO

## Session Tracking

TODO

## Authorization

TODO
