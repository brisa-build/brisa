export default function Privacy() {
  return (
    <main class="landing">
      <header class="hero">
        <h1>Terms & Conditions</h1>
        <p>Effective date: October 1, 2024</p>
      </header>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Brisa website and services, you agree to be
          bound by these Terms & Conditions, all applicable laws, and
          regulations. If you do not agree with these terms, you are prohibited
          from using or accessing this site.
        </p>
      </section>

      <section>
        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the
          materials (information or software) on Brisa's website for personal,
          non-commercial transitory viewing only. This is the grant of a
          license, not a transfer of title, and under this license, you may not:
        </p>
        <ul>
          <li>Modify or copy the materials;</li>
          <li>
            Use the materials for any commercial purpose or for any public
            display (commercial or non-commercial);
          </li>
          <li>
            Attempt to decompile or reverse engineer any software contained on
            Brisa's website;
          </li>
          <li>
            Remove any copyright or other proprietary notations from the
            materials; or
          </li>
          <li>
            Transfer the materials to another person or "mirror" the materials
            on any other server.
          </li>
        </ul>
        <p>
          This license shall automatically terminate if you violate any of these
          restrictions and may be terminated by Brisa at any time. Upon
          terminating your viewing of these materials or upon the termination of
          this license, you must destroy any downloaded materials in your
          possession whether in electronic or printed format.
        </p>
      </section>

      <section>
        <h2>3. Disclaimer</h2>
        <p>
          The materials on Brisa's website are provided on an 'as is' basis.
          Brisa makes no warranties, expressed or implied, and hereby disclaims
          and negates all other warranties including, without limitation,
          implied warranties or conditions of merchantability, fitness for a
          particular purpose, or non-infringement of intellectual property or
          other violation of rights.
        </p>
        <p>
          Further, Brisa does not warrant or make any representations concerning
          the accuracy, likely results, or reliability of the use of the
          materials on its website or otherwise relating to such materials or on
          any sites linked to this site.
        </p>
      </section>

      <section>
        <h2>4. Limitations</h2>
        <p>
          In no event shall Brisa or its suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or
          due to business interruption) arising out of the use or inability to
          use the materials on Brisa's website, even if Brisa or a Brisa
          authorized representative has been notified orally or in writing of
          the possibility of such damage.
        </p>
      </section>

      <section>
        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on Brisa's website could include technical,
          typographical, or photographic errors. Brisa does not warrant that any
          of the materials on its website are accurate, complete, or current.
          Brisa may make changes to the materials contained on its website at
          any time without notice. However, Brisa does not make any commitment
          to update the materials.
        </p>
      </section>
    </main>
  );
}

export function Head() {
  const title = `Terms & Conditions | Brisa`;
  const description = `The Brisa Terms & Conditions describe the terms of use for the Brisa website and services.`;
  const keywords = `brisa, terms, conditions`;

  return (
    <>
      <title id="title">{title}</title>
      <meta id="meta:title" name="title" content={title} />
      <meta id="og:title" property="og:title" content={title} />
      <meta id="twitter:title" property="twitter:title" content={title} />
      <meta id="keywords" name="keywords" content={keywords} />
      <meta id="meta:description" name="description" content={description} />
      <meta
        id="og:description"
        property="og:description"
        content={description}
      />
      <meta
        id="twitter:description"
        property="twitter:description"
        content={description}
      />
    </>
  );
}
