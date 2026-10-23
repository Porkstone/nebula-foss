import { ArrowLeft, Check, FileText, GitFork, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { licenses } from '../convex/lib/policy';
import { siteOperator } from './siteOperator';

const sections = [
  ['terms-service', 'About these terms'],
  ['terms-account', 'Your account'],
  ['terms-eligibility', 'Project eligibility'],
  ['terms-content', 'Your content and rights'],
  ['terms-use', 'Acceptable use'],
  ['terms-moderation', 'Listing and account restrictions'],
  ['terms-availability', 'External projects and availability'],
  ['terms-leaving', 'Removing listings and leaving'],
  ['terms-rights', 'Responsibility and legal rights'],
  ['terms-updates', 'Changes to these terms'],
  ['terms-contact', 'Contact us'],
] as const;

export function TermsOfService({onExplore}: {onExplore: () => void}) {
  return <main className="privacy-page">
    <Link className="text-button licence-back" to="/" onClick={onExplore}><ArrowLeft size={16}/> Back to the directory</Link>
    <header className="privacy-intro">
      <span className="eyebrow"><FileText size={16}/> SHARING PROJECTS ON NEBULA</span>
      <h1>Terms of Service</h1>
      <p>The ground rules for discovering, submitting, and managing projects in Nebula’s open-source directory.</p>
      <p className="privacy-updated">Last updated <time dateTime="2026-10-23">23 October 2026</time></p>
    </header>

    <div className="privacy-summary" aria-label="Terms at a glance">
      <div><Check size={20}/><p>Share eligible, permissively licensed projects.</p></div>
      <div><GitFork size={20}/><p>Each project keeps its own licence.</p></div>
      <div><FileText size={20}/><p>Keep listings accurate and respectful.</p></div>
    </div>

    <div className="privacy-layout">
      <nav className="privacy-contents" aria-label="Terms of Service contents">
        <span className="eyebrow">ON THIS PAGE</span>
        <ol>{sections.map(([id, title]) => <li key={id}><a href={`#${id}`}>{title}</a></li>)}</ol>
      </nav>
      <div className="privacy-body">
        <section aria-labelledby="terms-service">
          <h2 id="terms-service">1. About these terms</h2>
          <p>Nebula is a public directory of permissively licensed GitHub projects, operated by <strong>{siteOperator.operator}</strong> in the {siteOperator.country}. In these terms, “Nebula”, “we”, and “us” refer to that operator.</p>
          <p>These terms explain how you may use the directory. By creating an account or submitting a project, you agree to these terms. Read them before continuing; if you do not agree, do not create an account or submit content.</p>
          <p>You can browse without an account. There is currently no charge to browse or submit projects. Nebula is an independent directory and is not an endorsement or certification service for the projects it lists.</p>
        </section>

        <section aria-labelledby="terms-account">
          <h2 id="terms-account">2. Your account</h2>
          <p>An account is required to submit, edit, or remove your listings. Provide accurate account information, use an email address or Google account you are authorised to use, and do not impersonate another person or organisation.</p>
          <p>Keep your password and sign-in access secure. If you believe someone has used your account without permission, contact us promptly. You are responsible for content you submit and for activity you authorise through your account.</p>
          <p>Our <Link to="/privacy">privacy policy</Link> explains how we collect and use account, session, and listing information.</p>
        </section>

        <section aria-labelledby="terms-eligibility">
          <h2 id="terms-eligibility">3. Project eligibility</h2>
          <p>Only public GitHub repositories with a recognised licence from Nebula’s permitted set can be showcased. <strong>We recommend MIT.</strong> The current permitted identifiers are:</p>
          <p>{licenses.join(', ')}.</p>
          <p>A public repository without a recognised permitted licence is not eligible. We check licence information with GitHub before publishing and recheck repository details daily. GitHub’s detection can be incomplete, and eligibility can change if a repository becomes private, unavailable, or uses an unsupported licence.</p>
          <p>Anyone can share an eligible repository they find useful. You do not need to own it, but a submission must not claim ownership, an official affiliation, or an endorsement you do not have. Licence eligibility is Nebula’s showcase policy; it does not mean that the accepted licences have identical terms.</p>
          <p>Read the <Link to="/licences">licence policy</Link> for the permitted set and submission guidance.</p>
        </section>

        <section aria-labelledby="terms-content">
          <h2 id="terms-content">4. Your content and rights</h2>
          <p>You retain the rights you have in descriptions and other content you submit. Only submit text and material you created or have permission to share, and make sure your listing is accurate and does not infringe another person’s rights.</p>
          <p>By submitting a listing, you give Nebula non-exclusive permission to store, reproduce, format, index, and display that content as needed to operate and promote the directory and the listing. This permission does not transfer ownership. It ends when the listing is removed from the active directory, except for the limited retention explained in the privacy policy or required by law.</p>
          <p>Submitting a repository link does not grant Nebula or its visitors additional rights in that repository’s code. The project’s own licence, copyright notices, and other applicable terms govern reuse. Read and follow those terms before using a project.</p>
          <p>Published listings are public and may be indexed or copied by others. Do not include private information, credentials, or confidential material in a description.</p>
        </section>

        <section aria-labelledby="terms-use">
          <h2 id="terms-use">5. Acceptable use</h2>
          <p>Use Nebula lawfully and respect other people and the service. Do not:</p>
          <ul>
            <li>Submit misleading, fraudulent, infringing, harassing, or unlawful content, or publish another person’s private information without permission.</li>
            <li>Use listings for spam, phishing, or deliberately distributing malware.</li>
            <li>Impersonate a maintainer or misrepresent a project’s licence, purpose, affiliation, or maintenance status.</li>
            <li>Bypass authentication, ownership checks, licence checks, or other access controls, or attempt to access another user’s non-public information.</li>
            <li>Disrupt the site, overload its infrastructure, or use automated access in a way that interferes with other people’s use.</li>
          </ul>
          <p>If you find a security issue, report it privately to the contact address below rather than publishing personal information or exploiting the issue.</p>
        </section>

        <section aria-labelledby="terms-moderation">
          <h2 id="terms-moderation">6. Listing and account restrictions</h2>
          <p>Listings may be hidden or removed if they no longer meet the licence policy, contain materially inaccurate or harmful information, infringe rights, breach these terms, or must be removed by law. Passing an automated submission check does not guarantee that a listing will remain published.</p>
          <p>We may restrict an account or access to the service where reasonably necessary to address abuse, protect security, or comply with the law. We will act reasonably and proportionately, and provide an explanation and an opportunity to raise a concern where practical and lawful. Urgent security or legal action may require an immediate restriction.</p>
          <p>If you think a listing or restriction is mistaken, contact us with the repository URL and the relevant details. Do not send passwords or access tokens.</p>
        </section>

        <section aria-labelledby="terms-availability">
          <h2 id="terms-availability">7. External projects and availability</h2>
          <p>Nebula links to projects maintained by other people. A listing is not a promise about a project’s safety, quality, suitability, support, or legal status. We do not control external repositories, websites, or changes their maintainers make.</p>
          <p>Repository statistics and detected licences come from GitHub. Descriptions and contribution or maintenance preferences come from submitters. Information can become out of date between checks. A daily refresh schedule does not guarantee an immediate update when a repository changes.</p>
          <p>We aim to keep Nebula available and use reasonable care in running it. Maintenance, security work, technical failures, and third-party outages may interrupt the service. We do not promise uninterrupted access or a particular result from discovering or submitting a project.</p>
        </section>

        <section aria-labelledby="terms-leaving">
          <h2 id="terms-leaving">8. Removing listings and leaving</h2>
          <p>You can edit or remove your own listings in My projects and stop using Nebula at any time. To request account deletion, email us using the contact details below. We may need to verify that the account belongs to you.</p>
          <p>Removing a Nebula listing does not remove the GitHub repository, change its licence, or remove copies already made by search engines or other people. The <Link to="/privacy">privacy policy</Link> explains how active records, authentication information, and provider backups are handled.</p>
        </section>

        <section aria-labelledby="terms-rights">
          <h2 id="terms-rights">9. Responsibility and legal rights</h2>
          <p>You should assess a project and its licence before relying on it. Nebula’s role is to help people discover repositories; it does not replace your own checks or a project’s documentation.</p>
          <p>We remain responsible for our obligations under applicable law. Nothing in these terms excludes or limits liability for death or personal injury caused by our negligence, fraud or fraudulent misrepresentation, or any responsibility that cannot lawfully be excluded or limited.</p>
          <p>These terms do not take away mandatory consumer or data protection rights. If a provision cannot be enforced, the remaining provisions continue to apply so far as they can do so fairly and lawfully.</p>
          <p>If a dispute arises, you can contact us to try to resolve it. You do not have to use a particular arbitration process, and these terms do not prevent you from bringing a claim in a court where you are entitled to do so under applicable law.</p>
        </section>

        <section aria-labelledby="terms-updates">
          <h2 id="terms-updates">10. Changes to these terms</h2>
          <p>We may update these terms to reflect changes to the service, legal requirements, or security needs. We will publish the revised terms here and update the date above.</p>
          <p>For material changes affecting existing users, we will provide reasonable notice through the service where practical and obtain any further agreement required by law before applying them. Changes will not retroactively remove rights you already have. If you do not wish to use the service under revised terms, you can stop using it and request removal of your account.</p>
        </section>

        <section aria-labelledby="terms-contact">
          <h2 id="terms-contact">11. Contact us</h2>
          <div className="privacy-contact">
            <Mail size={22}/>
            <div><h3>{siteOperator.operator}</h3><p>{siteOperator.country}</p><a href={`mailto:${siteOperator.email}`}>{siteOperator.email}</a></div>
          </div>
          <p>Contact us about these terms, a listing, an account restriction, a rights concern, or a security report. Include enough information for us to understand the issue and avoid sharing unnecessary sensitive information.</p>
        </section>
      </div>
    </div>
  </main>;
}
