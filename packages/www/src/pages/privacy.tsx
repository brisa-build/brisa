export default function Privacy() {
  return (
    <main class="landing">
      <header class="hero">
        <h1>Privacy Policy</h1>
        <p>Effective date: October 1, 2024</p>
      </header>

      <section>
        <h2>General Information</h2>
        <p>
          The Brisa Privacy Policy describes the privacy practices of the Brisa
          website and services. The laws of Spain and the European Union apply.
          If you are a resident of the EU/EEA, the European Commission-approved
          Standard Contractual Clauses (also referred to as Model Contracts)
          apply to data transfers outside of the EU/EEA.
        </p>
        <p>
          We collect limited personally identifiable information (the "data")
          from GitHub, and from those who communicate with us directly via
          email. This includes aggregate information on the pages consumers
          access or visit, and data voluntarily provided by the consumer (such
          as survey information or site registrations). The information we
          collect is used to provide and improve our services and is not shared
          with or sold to other organizations for commercial purposes, except
          under the following circumstances:
        </p>
        <ul>
          <li>
            It is necessary to share information to investigate, prevent, or
            take action regarding illegal activities, suspected fraud, or
            situations involving potential threats to the physical safety of any
            person, violations of Terms of Service, or as otherwise required by
            law.
          </li>
          <li>
            If Brisa is acquired by or merged with another company. In such an
            event, Brisa will notify you before your information is transferred
            and becomes subject to a different privacy policy.
          </li>
        </ul>
      </section>

      <section>
        <h2>Analytics and Third-Party Services</h2>
        <p>
          We use Google Analytics to help us understand how our customers use
          the site. You can read more about how Google uses your Personal
          Information here:{' '}
          <a href="https://www.google.com/intl/en/policies/privacy/">
            Google Privacy Policy
          </a>
          . You can also opt-out of Google Analytics here:{' '}
          <a href="https://tools.google.com/dlpage/gaoptout">
            Google Analytics Opt-out Browser Add-on
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Links</h2>
        <p>
          Our website may contain links to third-party sites. We are not
          responsible for the privacy practices of third-party websites. Please
          read their privacy policies when visiting those sites.
        </p>
      </section>

      <section>
        <h2>Changes to the Privacy Policy</h2>
        <p>
          Brisa may update this Privacy Policy from time to time. We encourage
          you to review this page periodically for the latest information on our
          privacy practices.
        </p>
      </section>
    </main>
  );
}

export function Head() {
  return <title id="title">Privacy Policy | Brisa</title>;
}
