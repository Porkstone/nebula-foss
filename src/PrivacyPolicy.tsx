import { ArrowLeft, ArrowUpRight, Database, Eye, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteOperator as privacyContact } from './siteOperator';

const sections = [
  ['privacy-operator', 'Who operates Nebula'],
  ['privacy-data', 'Information we collect'],
  ['privacy-use', 'How we use information'],
  ['privacy-public', 'What is public'],
  ['privacy-google', 'Google sign-in'],
  ['privacy-storage', 'Cookies and browser storage'],
  ['privacy-providers', 'Services we use'],
  ['privacy-retention', 'Retention and deletion'],
  ['privacy-rights', 'Your choices and rights'],
  ['privacy-contact', 'Contact and updates'],
] as const;

export function PrivacyPolicy({onExplore}: {onExplore: () => void}) {
  return <main className="privacy-page">
    <Link className="text-button licence-back" to="/" onClick={onExplore}><ArrowLeft size={16}/> Back to the directory</Link>
    <header className="privacy-intro">
      <span className="eyebrow"><ShieldCheck size={16}/> YOUR INFORMATION ON NEBULA</span>
      <h1>Privacy policy</h1>
      <p>What we collect, why we use it, and the choices you have when you discover and share open-source projects.</p>
      <p className="privacy-updated">Last updated <time dateTime="2026-10-23">23 October 2026</time></p>
    </header>

    <div className="privacy-summary" aria-label="Privacy at a glance">
      <div><Eye size={20}/><p>Browse without an account.</p></div>
      <div><Database size={20}/><p>Project submissions are public.</p></div>
      <div><LockKeyhole size={20}/><p>Account emails stay out of the directory.</p></div>
    </div>

    <div className="privacy-layout">
      <nav className="privacy-contents" aria-label="Privacy policy contents">
        <span className="eyebrow">ON THIS PAGE</span>
        <ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol>
      </nav>
      <div className="privacy-body">
        <section aria-labelledby="privacy-operator">
          <h2 id="privacy-operator">1. Who operates Nebula</h2>
          <p>Nebula is a public directory of permissively licensed GitHub projects, operated by <strong>{privacyContact.operator}</strong> in the {privacyContact.country}. In this policy, “Nebula”, “we”, and “us” refer to that operator, who is responsible for the personal information used to run this service.</p>
          <p>This policy covers browsing the site, creating or signing into an account, and submitting or managing project listings. It also covers information you provide when contacting us about the service.</p>
        </section>

        <section aria-labelledby="privacy-data">
          <h2 id="privacy-data">2. Information we collect</h2>
          <ul>
            <li><strong>Account information.</strong> Your email address and an account identifier. If you use Google sign-in, we also receive your name, profile picture URL, and Google account identifier. For email/password accounts, the authentication service stores a password hash rather than a readable password.</li>
            <li><strong>Authentication records.</strong> Sign-in provider details, session and refresh-token records, verification information, and information used to limit repeated sign-in attempts.</li>
            <li><strong>Project listings.</strong> Repository URLs, the descriptions and categories you choose, contribution and maintenance preferences, the submitting account identifier, and listing timestamps.</li>
            <li><strong>Public GitHub information.</strong> Repository and owner names, repository identifiers, detected licences, stars, forks, programming languages, archive status, and update information used to check and refresh listings.</li>
            <li><strong>Technical information.</strong> Our hosting and backend providers may process IP addresses, browser/device information, request times, and diagnostic or security logs when delivering and protecting the service.</li>
            <li><strong>Messages to us.</strong> Your contact details and the information you choose to include in a privacy or support request.</li>
          </ul>
          <p>You can browse the directory without registering. An account is required to submit or manage listings.</p>
        </section>

        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use">3. How we use information</h2>
          <p>We use account and session information to authenticate you and let you manage your own submissions. We use project and GitHub information to publish the directory, support search and filters, check licence eligibility, and refresh repository details.</p>
          <p>We use technical records to operate the service, diagnose failures, prevent abuse, and protect accounts. If you contact us, we use your message to respond and handle your request. We may also process information when needed to meet a legal obligation.</p>
          <p>Where UK or EEA data protection law applies, we rely on providing the service you request for account and listing functions, our legitimate interests in running a secure and reliable directory for operational and security processing, and legal obligations where applicable. Where a separate activity requires consent, we will ask for it and you can withdraw it.</p>
          <p>We do not sell personal information or use Google sign-in information for advertising. Nebula does not include advertising or optional third-party analytics trackers.</p>
        </section>

        <section aria-labelledby="privacy-public">
          <h2 id="privacy-public">4. What is public</h2>
          <p>Your submitted repository, description, category, contribution and maintenance preferences, and repository statistics are public when a listing is eligible. Public listing responses also contain listing timestamps and an account identifier, which can link submissions made by the same account.</p>
          <p>Your account email address, sign-in credentials, and Google profile information are not included in public directory listings. Avoid putting personal or confidential information in a project description.</p>
          <p>Public pages may be indexed by search engines or copied by others. Removing a listing from Nebula does not remove its GitHub repository or copies held by third parties.</p>
        </section>

        <section aria-labelledby="privacy-google">
          <h2 id="privacy-google">5. Google sign-in</h2>
          <p>If you choose Continue with Google, Nebula requests basic identity information using the OpenID, profile, and email permissions. We use it to create or identify your Nebula account and sign you in.</p>
          <p>Google does not share your Google password with Nebula. Our Google sign-in integration does not request access to Gmail messages, Google Drive files, contacts, or calendars.</p>
          <p>You can review or remove the connection in your <a href="https://myaccount.google.com/connections" target="_blank" rel="noreferrer">Google account settings <ArrowUpRight size={13}/></a>. Removing Google's permission does not automatically delete your Nebula account, your project listings, or an existing Nebula session; sign out and contact us if you also want your account deleted.</p>
        </section>

        <section aria-labelledby="privacy-storage">
          <h2 id="privacy-storage">6. Cookies and browser storage</h2>
          <p>Nebula stores authentication information in your browser’s local storage to keep you signed in. It also stores your selected light, dark, or system theme. Temporary security cookies and verification information are used during Google sign-in.</p>
          <p>These support sign-in and your chosen preferences. We do not add advertising or analytics cookies. Google and infrastructure providers may use their own cookies when you interact with their services.</p>
          <p>Signing out removes the stored Nebula authentication tokens from that browser. You can clear local storage and cookies through your browser settings; doing so may sign you out and reset your theme. It does not delete account information held on the server.</p>
        </section>

        <section aria-labelledby="privacy-providers">
          <h2 id="privacy-providers">7. Services we use</h2>
          <p>Information is processed by the services needed to run Nebula:</p>
          <ul className="privacy-provider-list">
            <li><strong>Convex</strong> provides the backend database, authentication infrastructure, and server functions. <a href="https://www.convex.dev/legal/privacy" target="_blank" rel="noreferrer">Convex privacy policy <ArrowUpRight size={13}/></a></li>
            <li><strong>Vercel</strong> hosts and delivers the deployed website and may process request, infrastructure, and security information. <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer">Vercel privacy notice <ArrowUpRight size={13}/></a></li>
            <li><strong>Google</strong> authenticates you when you choose Google sign-in and provides the basic identity information described above. <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy <ArrowUpRight size={13}/></a></li>
            <li><strong>GitHub</strong> receives repository lookup requests from our backend and supplies public repository metadata. You do not need to connect a GitHub account to Nebula. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHub privacy statement <ArrowUpRight size={13}/></a></li>
          </ul>
          <p>Authorised operators and service providers may access information as needed to run and secure the service or handle a support request. We may disclose information when required by law or necessary to address abuse or protect legal rights.</p>
          <p>Providers may process information outside your country, including in the United States. Their privacy and data-processing documents describe their locations and transfer safeguards. Contact us for information about the safeguards applicable to your data.</p>
        </section>

        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">8. Retention and deletion</h2>
          <p>Account information remains stored while your account exists so we can identify you and maintain your listings. Inactive accounts are not automatically deleted. Listings stay in the database until removed; a listing hidden for an unsupported licence remains available to its submitter.</p>
          <p>You can remove your own listings through My projects. Removal deletes that listing from Nebula’s active database. Account deletion currently requires a request to the operator; there is no self-service account deletion button.</p>
          <p>Authentication records have expiry or revocation rules, but an expired session does not delete your account. Diagnostic records and provider backups may remain after a deletion according to the provider’s configured retention and any necessary security or legal requirements. We do not promise immediate erasure of backup copies or information already copied from public listings.</p>
        </section>

        <section aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">9. Your choices and rights</h2>
          <p>You can browse without an account, edit or remove your project listings, sign out, clear browser storage, and disconnect Google sign-in. To request a copy of your account information, a correction, or account deletion, contact us using the details below. We may need to verify that the account belongs to you before acting.</p>
          <p>Depending on the law that applies to you, you may also have rights to object to processing, restrict it, receive a portable copy of information, or withdraw consent where processing relies on consent. Some information may need to be retained to meet legal requirements or protect the service.</p>
          <p>You may raise a concern with your local data protection authority. In the UK, this is the <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">Information Commissioner’s Office <ArrowUpRight size={13}/></a>.</p>
        </section>

        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">10. Contact and updates</h2>
          <div className="privacy-contact">
            <Mail size={22}/>
            <div><h3>{privacyContact.operator}</h3>
              <p>{privacyContact.country}</p>
              <a href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a>
            </div>
          </div>
          <p>Contact us about privacy questions, access requests, corrections, or account deletion. Please avoid including passwords, access tokens, or other unnecessary sensitive information in your message.</p>
          <p>We will update this page when our data practices change and revise the date above. If a material change affects how we use personal information, we will provide any additional notice required by applicable law.</p>
        </section>
      </div>
    </div>
  </main>;
}
