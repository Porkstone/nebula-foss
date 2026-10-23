import { ArrowLeft, ArrowUpRight, Check, FileCheck2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { licenses } from '../convex/lib/policy';
import type { PermittedLicense } from '../convex/lib/policy';

const licenceDetails: Record<PermittedLicense, {name: string; description: string}> = {
  MIT: {name: 'MIT', description: 'Our recommended choice. Allows reuse, modification, distribution, and commercial use while retaining the copyright and licence notice.'},
  Unlicense: {name: 'Unlicense', description: 'A public-domain dedication with broad permission to use the code, without an attribution requirement.'},
  'CC0-1.0': {name: 'CC0 1.0 Universal', description: 'A public-domain dedication with a fallback licence. Not OSI-approved; patent rights are excluded.'},
  '0BSD': {name: 'Zero-Clause BSD', description: 'A permissive, OSI-approved licence without an attribution requirement.'},
  'MIT-0': {name: 'MIT No Attribution', description: 'An MIT variant that removes the attribution requirement.'},
  WTFPL: {name: 'WTFPL', description: 'Broad permission with no conditions on reuse. Its informal wording may need review by your team.'},
  ISC: {name: 'ISC', description: 'Short, permissive terms similar to MIT, with copyright and permission notices retained.'},
  'BSD-2-Clause': {name: 'BSD 2-Clause', description: 'Permits reuse with copyright, licence conditions, and the disclaimer retained in source and binary redistributions.'},
  'BSD-3-Clause': {name: 'BSD 3-Clause', description: 'BSD 2-Clause terms with an additional restriction on using contributors’ names to endorse derived products.'},
  Zlib: {name: 'Zlib', description: 'Requires honest attribution of origin and clear marking of altered source. Binary distributions do not require attribution.'},
  'BSL-1.0': {name: 'Boost Software License 1.0', description: 'Requires notices in source copies, with an exception for compiled, machine-executable object code.'},
};

export function LicensePolicy({onExplore}: {onExplore: () => void}) {
  return <main className="licence-page">
    <Link className="text-button licence-back" to="/" onClick={onExplore}><ArrowLeft size={16}/> Back to the directory</Link>
    <header className="licence-intro">
      <div>
        <span className="eyebrow"><ShieldCheck size={16}/> THE NEBULA LICENCE POLICY</span>
        <h1>Open to discover.<br/><span>Free to build on.</span></h1>
      </div>
      <div className="licence-intro-copy">
        <p>Nebula only showcases projects with a permitted permissive licence. We want useful code to be easy to use, adapt, share, and build into something new, including commercial projects.</p>
        <a className="text-button" href="#permitted-licences">See the permitted licences <ArrowUpRight size={16}/></a>
      </div>
    </header>

    <section className="licence-section" aria-labelledby="choose-mit">
      <div className="licence-section-label"><span className="eyebrow">01 / OUR RECOMMENDATION</span><h2 id="choose-mit">Start with MIT.</h2></div>
      <div className="mit-recommendation">
        <div className="licence-recommendation-heading"><span className="licence-mit-mark">MIT</span><span className="licence-recommended"><Check size={14}/> Recommended</span></div>
        <p>If you maintain a project and are choosing a licence, we recommend MIT. It gives people broad permission to use and share your work, with a straightforward requirement to keep the copyright and licence notice.</p>
        <p>Make sure you have the rights to license the code, then add the MIT licence text to a <code>LICENSE</code> file in your repository. Submit once GitHub recognises it.</p>
        <a className="text-button" href="https://choosealicense.com/licenses/mit/" target="_blank" rel="noreferrer">Get the MIT licence text <ArrowUpRight size={16}/></a>
      </div>
    </section>

    <section className="licence-section" aria-labelledby="permitted-licences">
      <div className="licence-section-label"><span className="eyebrow">02 / THE PERMITTED SET</span><h2 id="permitted-licences">Room for choice.</h2><p>MIT and these alternatives are accepted under Nebula’s showcase policy. Their terms differ; follow the licence that applies to the project you use.</p></div>
      <dl className="licence-list">
        {licenses.map(id => <div className="licence-entry" key={id}>
          <dt><a href={`https://spdx.org/licenses/${id}.html`} target="_blank" rel="noreferrer">{licenceDetails[id].name}<ArrowUpRight size={15}/></a><code>{id}</code></dt>
          <dd>{licenceDetails[id].description}</dd>
        </div>)}
      </dl>
    </section>

    <section className="licence-section" aria-labelledby="licence-checks">
      <div className="licence-section-label"><span className="eyebrow">03 / BEFORE YOU SUBMIT</span><h2 id="licence-checks">A licence comes first.</h2></div>
      <div className="licence-checks">
        <div><FileCheck2 size={21}/><div><h3>We check the repository on GitHub.</h3><p>A public repository needs a recognised licence from the permitted set above before it can be added. Being publicly visible does not, by itself, grant permission to reuse the code.</p></div></div>
        <div><ShieldCheck size={21}/><div><h3>Unrecognised or unsupported licences are declined.</h3><p>Repositories with no licence, a custom or unrecognised licence, or a licence outside this list cannot be showcased. This includes Apache-2.0 and copyleft licences such as GPL or AGPL. If you maintain the project, we recommend MIT.</p></div></div>
        <div><Check size={21}/><div><h3>The policy continues after publishing.</h3><p>We recheck repository details daily. Listings that no longer meet the policy are hidden from the public directory. Their submitters can still see the reason in My projects.</p></div></div>
        <p className="licence-source">GitHub’s detection can miss a licence, and it does not check dependency licences. Make sure the repository contains a standard licence file and GitHub recognises it before trying again. <a href="https://docs.github.com/en/rest/licenses/licenses#about-licenses" target="_blank" rel="noreferrer">How GitHub identifies licences <ArrowUpRight size={13}/></a></p>
      </div>
    </section>
    <div className="licence-outro"><ShieldCheck size={23}/><p>Useful code. Clear permissions.<br/><strong>A better starting point for your next idea.</strong></p><Link className="button primary" to="/#explore" onClick={onExplore}>Explore projects <ArrowUpRight size={17}/></Link></div>
  </main>;
}
