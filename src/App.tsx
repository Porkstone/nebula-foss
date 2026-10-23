import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ConvexError } from 'convex/values';
import { useAuthActions } from '@convex-dev/auth/react';
import { useAction, useConvexAuth, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Code2, Command, ExternalLink, GitFork, Globe2, Layers3, Loader2, Plus, Search, ShieldCheck, Sparkles, Terminal, Users, X } from 'lucide-react';
import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
import { categories, licenses } from '../convex/lib/policy';
import './App.css';
import { ThemeControl } from './ThemeControl';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LicensePolicy } from './LicensePolicy';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';

function Modal({ children, close, title }: {children: ReactNode; close: () => void; title: string}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onCancel={close} onClick={e => {if (e.target === e.currentTarget) close();}}><div className="modal-heading"><span className="eyebrow">THE OPEN SOURCE UNIVERSE</span><button className="icon-button" onClick={close} aria-label="Close dialog"><X size={21}/></button></div><h2>{title}</h2>{children}</dialog>;
}
const errorText = (error: unknown) => error instanceof ConvexError && typeof error.data === 'object' && error.data !== null && 'message' in error.data ? String(error.data.message) : error instanceof Error ? error.message.replace(/^.*Uncaught (?:ConvexError|Error): /s, '').replace(/\n\s+at[\s\S]*/, '') : 'Something went wrong. Please try again.';

function AuthForm({close}: {close: () => void}) {
  const {signIn} = useAuthActions();
  const [signup, setSignup] = useState(true);
  const [pending, setPending] = useState<'google' | 'password' | null>(null);
  const [error, setError] = useState('');
  const busy = pending !== null;

  async function continueWithGoogle() {
    if (busy) return;
    setPending('google');
    setError('');
    try {
      const result = await signIn('google');
      if (result.signingIn) close();
      if (!result.redirect) setPending(null);
    } catch {
      setError('Unable to connect to Google. Please try again or use your email and password.');
      setPending(null);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setPending('password');
    setError('');
    const data = new FormData(e.currentTarget);
    data.set('flow', signup ? 'signUp' : 'signIn');
    try {
      await signIn('password', data);
      close();
    } catch {
      setError(signup ? 'Unable to create your account. The email may already be registered.' : 'Sign-in failed. Check your email and password.');
    } finally {
      setPending(null);
    }
  }

  return <Modal title={signup ? 'Create your account' : 'Sign in to Nebula'} close={close}>
    <p className="muted">{signup ? 'Join Nebula to share useful projects with curious people.' : 'Sign in to manage your open-source projects.'}</p>
    <p className="small muted">By continuing, you agree to our <Link className="inline-link" to="/terms" onClick={close}>Terms of Service</Link>. Our <Link className="inline-link" to="/privacy" onClick={close}>privacy policy</Link> explains how we use your information.</p>
    <button type="button" className="button full" onClick={() => void continueWithGoogle()} disabled={busy}>
      {pending === 'google' ? <Loader2 className="spin" size={18} aria-hidden="true"/> : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.52l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59c.79-2.36 3-4.12 5.6-4.12Z"/></svg>}
      {pending === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
    </button>
    <div className="auth-divider">or continue with email</div>
    {error && <p role="alert" className="error">{error}</p>}
    <form onSubmit={submit}>
      <label>Email address<input name="email" type="email" required disabled={busy} autoComplete="email" placeholder="you@example.com" maxLength={254}/></label>
      <label>Password<input name="password" type="password" required disabled={busy} minLength={12} autoComplete={signup ? 'new-password' : 'current-password'} placeholder="At least 12 characters"/></label>
      <button className="button primary full" disabled={busy}>{pending === 'password' ? <Loader2 className="spin" size={18}/> : signup ? 'Create your account' : 'Sign in'}<ArrowRight size={17}/></button>
    </form>
    <p className="form-footer">{signup ? 'Already part of the universe?' : 'New to Nebula?'} <button className="text-button" disabled={busy} onClick={() => {setSignup(!signup); setError('');}}>{signup ? 'Sign in' : 'Create an account'}</button></p>
  </Modal>;
}

function ProjectForm({project, close, done}: {project?: Doc<'projects'>; close: () => void; done: (message: string) => void}) {
  const [retryAt, setRetryAt] = useState(0); const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!retryAt) return; const timer = setInterval(() => { const current = Date.now(); setNow(current); if (current >= retryAt) setRetryAt(0); }, 1000); return () => clearInterval(timer); }, [retryAt]);
  const submitProject = useAction(api.github.submit); const edit = useMutation(api.projects.edit); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {e.preventDefault(); setBusy(true); setError(''); const data = new FormData(e.currentTarget); const info = {category: String(data.get('category')), description: String(data.get('description')).trim(), contributions: data.has('contributions'), maintained: data.has('maintained')}; try {if (project) await edit({id: project._id, ...info}); else await submitProject({repository: String(data.get('repository')), ...info}); done(project ? 'Changes saved.' : 'Project published.'); close();} catch (err) {setError(errorText(err)); if (err instanceof ConvexError && typeof err.data === 'object' && err.data !== null && 'retryAt' in err.data && typeof err.data.retryAt === 'number') {setNow(Date.now()); setRetryAt(err.data.retryAt);} } finally {setBusy(false);} }
  return <Modal title={project ? 'Edit project' : 'Submit a project'} close={close}><p className="muted">Share a public GitHub repository with a permitted permissive licence. We recommend MIT.</p><form onSubmit={submit}><label>GitHub repository<input name="repository" type="url" placeholder="https://github.com/owner/project" required disabled={!!project} defaultValue={project ? `https://github.com/${project.fullName}` : ''}/></label><label>Category<select name="category" defaultValue={project?.category || categories[0]}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>What is it useful for?<textarea name="description" rows={4} required minLength={20} maxLength={1200} placeholder="Tell people what they can build, solve, or explore with this project…" defaultValue={project?.description}/></label><label className="check-label"><input name="contributions" type="checkbox" defaultChecked={project?.contributions ?? true}/> Welcoming contributions</label><label className="check-label"><input name="maintained" type="checkbox" defaultChecked={project?.maintained ?? true}/> Actively maintained</label><p className="small muted">Permitted licences: {licenses.join(', ')}. We check the repository’s licence with GitHub before publishing. <Link className="inline-link" to="/licences" onClick={close}>Read our licence policy</Link>.</p>{error && <p className="error" role="alert">{error}</p>}<button className="button primary full" disabled={busy || retryAt > now}>{retryAt > now ? `Retry in ${Math.ceil((retryAt - now) / 1000)}s` : busy ? <><Loader2 size={18} className="spin"/> Checking with GitHub…</> : <>{project ? 'Save changes' : 'Publish project'}<ArrowUpRight size={18}/></>}</button></form></Modal>;
}

const categoryIcons = [Terminal, Code2, Sparkles, Command, Layers3, Globe2];
function ProjectCard({project, manage, edit, remove}: {project: Doc<'projects'>; manage: boolean; edit: () => void; remove: () => void}) {
  const [owner, name] = project.fullName.split('/'); const Icon = categoryIcons[Math.max(0, categories.indexOf(project.category as typeof categories[number])) % categoryIcons.length];
  return <article className="project-card"><div className="card-top"><div className={`project-icon tone-${project.githubId % 4}`}><Icon size={26} strokeWidth={1.6}/></div><span className="license"><ShieldCheck size={12}/>{project.license}</span></div><a className="project-title" href={`https://github.com/${project.fullName}`} target="_blank" rel="noreferrer"><h3>{name}</h3><ArrowUpRight size={19}/></a><span className="repo-owner">{owner} / {name}</span><p className="project-description">{project.description}</p><span className="category-tag">{project.category}</span><div className="project-status">{project.maintained && !project.archived ? <span><i className="status-dot"/> Actively maintained</span> : <span className="muted">{project.archived ? 'Archived on GitHub' : 'Not actively maintained'}</span>}{project.contributions && <span><Users size={13}/> Open to contributions</span>}</div><div className="card-bottom"><span>☆ {Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(project.stars)}</span><span><GitFork size={14}/>{Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 1}).format(project.forks)}</span><span className="language"><i/>{project.language}</span></div>{manage && <div className="manage-controls">{!project.visible && <p className="error">Hidden: {project.refreshError}</p>}{project.visible && project.refreshError && <p className="error">Last refresh: {project.refreshError}</p>}<small className="muted">Checked {new Date(project.lastChecked).toLocaleString()}</small><div><button className="text-button" onClick={edit}>Edit listing</button><button className="text-button danger" onClick={remove}>Remove</button></div></div>}</article>;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = location.pathname === '/terms' ? 'Terms of Service — Nebula' : location.pathname === '/privacy' ? 'Privacy policy — Nebula' : location.pathname === '/licences' ? 'Permissive licence policy — Nebula' : 'Nebula — Good code deserves to be discovered';
    document.querySelector('meta[name="description"]')?.setAttribute('content', location.pathname === '/terms'
      ? 'The terms for using Nebula, sharing permissively licensed projects, and managing your account and listings.'
      : location.pathname === '/privacy'
      ? 'How Nebula collects, uses, and protects account and project information, and how to exercise your privacy rights.'
      : location.pathname === '/licences'
        ? 'Nebula only showcases projects with a permitted permissive licence. Read the policy and see every accepted licence.'
        : 'Discover useful open-source projects. Share public GitHub repositories and find your next contribution.');
    if (location.hash === '#explore') document.getElementById('explore')?.scrollIntoView();
    else if (location.hash === '') window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  const {isAuthenticated} = useConvexAuth(); const {signOut} = useAuthActions();
  const [modal, setModal] = useState<'auth' | 'submit' | 'about' | null>(null); const [editing, setEditing] = useState<Doc<'projects'> | undefined>(); const [deleting, setDeleting] = useState<Doc<'projects'> | null>(null);
  const [mine, setMine] = useState(false); const [category, setCategory] = useState(''); const [search, setSearch] = useState(''); const [debounced, setDebounced] = useState(''); const [sort, setSort] = useState('stars'); const [contributions, setContributions] = useState(false); const [maintained, setMaintained] = useState(false); const [toast, setToast] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {const t = setTimeout(() => setDebounced(search), 250); return () => clearTimeout(t);}, [search]);
  useEffect(() => {if (!toast) return; const t = setTimeout(() => setToast(''), 5000); return () => clearTimeout(t);}, [toast]);
  useEffect(() => {function key(e: KeyboardEvent) {if ((e.metaKey || e.ctrlKey) && e.key === 'k') {e.preventDefault(); input.current?.focus();}} window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);}, []);
  const {results, status, loadMore} = usePaginatedQuery(api.projects.list, location.pathname === '/' ? {search: debounced, category, contributions, maintained, sort} : 'skip', {initialNumItems: 12});
  const own = useQuery(api.projects.mine, isAuthenticated && location.pathname === '/' ? {} : 'skip'); const remove = useMutation(api.projects.remove);
  const projects = mine ? own ?? [] : results;
  const add = () => {setEditing(undefined); setModal(isAuthenticated ? 'submit' : 'auth');};
  return <><header className="site-header">
    <Link className="brand" to="/" aria-label="Nebula home" onClick={() => setMine(false)}><span className="brand-mark">✳</span>nebula<span className="brand-suffix">/ open source</span></Link>
    <nav aria-label="Main navigation">
      <Link to="/#explore" className={location.pathname === '/' && !mine ? 'nav-active' : ''} onClick={() => {setMine(false); document.getElementById('explore')?.scrollIntoView({behavior: 'smooth'});}}>Explore</Link>
      <button onClick={() => setModal('about')}>The mission <ArrowUpRight size={13}/></button>
      <Link to="/licences" className={location.pathname === '/licences' ? 'nav-active' : ''} aria-current={location.pathname === '/licences' ? 'page' : undefined}>Licences</Link>
      {isAuthenticated ? <><button className={location.pathname === '/' && mine ? 'nav-active' : ''} onClick={() => {setMine(true); navigate('/#explore');}}>My projects</button><button onClick={() => {void signOut(); setMine(false);}}>Sign out</button></> : <button onClick={() => setModal('auth')}>Sign in</button>}
      <ThemeControl/><button className="button primary small-button" onClick={add}><Plus size={16}/> Submit a project</button>
    </nav>
  </header>
  <Routes><Route path="/" element={<main><section className="hero"><div className="hero-copy"><span className="eyebrow"><i className="orange-dot"/> INDEPENDENT MINDS. OPEN POSSIBILITIES.</span><h1>Good code deserves<br/>to be <span>discovered.</span></h1><p>Discover useful open-source projects.<br className="desktop-break"/> Share what you’re building. Find a place to contribute.<br className="desktop-break"/> Build something better, together.</p><p className="hero-licence-note">Nebula only showcases permissively licensed projects. Every submission must use a licence from our permitted list, and we recommend MIT. <Link className="inline-link" to="/licences">Read our licence policy</Link>.</p><div className="hero-actions"><a href="#explore" className="button primary">Find your next project <ArrowDown size={17}/></a><button className="text-button" onClick={add}>Share yours <ArrowUpRight size={17}/></button></div><div className="hero-note"><div className="mini-symbols"><Code2/><Terminal/><Command/></div><span>Built in the open. Better together.</span></div></div><div className="hero-art"><div className="art-heading"><Code2 size={20}/> Open source, connected.</div><div className="art-step"><Globe2/><div><strong>Share a public repository</strong><p>Give people a clear description of what your project helps them do.</p></div></div><div className="art-step"><Users/><div><strong>Find your next contribution</strong><p>Discover projects that welcome ideas, improvements, and new contributors.</p></div></div><div className="art-step"><GitFork/><div><strong>Stay connected to GitHub</strong><p>Repository details are refreshed daily, alongside your project description.</p></div></div></div></section>
  <div className="principles"><span><Globe2 size={17}/> Public by nature</span><span><ShieldCheck size={17}/> Permissively licensed</span><span><Users size={17}/> Community powered</span><span><GitFork size={17}/> Synced with GitHub daily</span></div>
  <section id="explore" className="explore"><div className="section-heading"><div className="heading-inline"><h2>{mine ? 'Your projects' : 'Explore projects'}</h2><span className="section-number">/ {mine ? 'YOUR PROJECTS' : 'THE DIRECTORY'}</span></div><p>{mine ? 'Keep your listings useful, current, and ready to be discovered.' : 'Useful tools, thoughtful experiments, and your next contribution.'}</p></div>
  {!mine && <><div className="search-row"><div className="search-box"><Search size={19}/><input ref={input} aria-label="Search projects" placeholder="Search projects, ideas, possibilities…" value={search} onChange={e => setSearch(e.target.value)}/>{search ? <button className="icon-button" onClick={() => setSearch('')} aria-label="Clear search"><X size={16}/></button> : <kbd>⌘ K</kbd>}</div><label className="sort-control">Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="stars">Most starred</option><option value="newest">Newest added</option></select></label></div><div className="categories"><button aria-pressed={!category} className={!category ? 'selected' : ''} onClick={() => setCategory('')}><Layers3 size={14}/> All projects</button>{categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="results-bar"><span>{status === 'LoadingFirstPage' ? 'Loading projects…' : `${projects.length}${status === 'CanLoadMore' ? '+' : ''} projects to explore`}</span><div><label><input type="checkbox" checked={contributions} onChange={e => setContributions(e.target.checked)}/> Open to contributions</label><label><input type="checkbox" checked={maintained} onChange={e => setMaintained(e.target.checked)}/> Actively maintained</label></div></div></>}
  {(!mine && status === 'LoadingFirstPage') || (mine && own === undefined) ? <div className="loading"><Loader2 className="spin"/> Loading projects…</div> : projects.length ? <div className="project-grid">{projects.map(project => <ProjectCard key={project._id} project={project} manage={mine} edit={() => {setEditing(project); setModal('submit');}} remove={() => setDeleting(project)}/>)}</div> : <div className="empty-state"><div className="empty-symbol">✳</div><h3>{mine ? 'No projects yet' : search || category || contributions || maintained ? 'No matching projects' : 'Share the first project'}</h3><p>{mine ? 'Add your first repository and help someone discover their next favorite tool.' : search || category || contributions || maintained ? 'No projects match these filters. Try a different search.' : 'Be the first to share a useful open-source project with the community.'}</p><button className="button dark" onClick={search || category || contributions || maintained ? () => {setSearch(''); setCategory(''); setContributions(false); setMaintained(false);} : add}>{search || category || contributions || maintained ? 'Clear filters' : 'Share a project'}<ArrowRight size={16}/></button></div>}
  {!mine && status === 'CanLoadMore' && <button className="button load-more" onClick={() => loadMore(12)}>Explore more projects <ArrowDown size={16}/></button>}{status === 'LoadingMore' && <div className="loading"><Loader2 className="spin"/></div>}
  </section><section className="share-banner"><div className="banner-symbol">✳</div><div><span className="eyebrow">SHARE YOUR WORK</span><h2>Built something useful?</h2><p>There’s someone out there looking for exactly what you made.</p></div><button className="button primary" onClick={add}>Submit a project <ArrowUpRight size={18}/></button></section></main>}/><Route path="/licences" element={<LicensePolicy onExplore={() => setMine(false)}/>}/><Route path="/privacy" element={<PrivacyPolicy onExplore={() => setMine(false)}/>}/><Route path="/terms" element={<TermsOfService onExplore={() => setMine(false)}/>}/><Route path="*" element={<main className="licence-page"><h1>Page not found</h1><Link className="button" to="/">Back to the directory</Link></main>}/></Routes>
  <footer><Link className="brand" to="/" onClick={() => setMine(false)}><span className="brand-mark">✳</span>nebula</Link><span>A small home for open possibilities.</span><nav className="footer-links" aria-label="Footer navigation"><Link className="text-button" to="/licences">Our licence policy</Link><Link className="text-button" to="/privacy">Privacy policy</Link><Link className="text-button" to="/terms">Terms of Service</Link><button className="text-button" onClick={() => setModal('about')}>Made for the open-source universe <ArrowUpRight size={14}/></button></nav></footer>
  {modal === 'auth' && <AuthForm close={() => setModal(null)}/>} {modal === 'submit' && <ProjectForm project={editing} close={() => setModal(null)} done={setToast}/>}
  {modal === 'about' && <Modal title="Open code. Endless possibilities." close={() => setModal(null)}><p>Nebula is a community directory for public, permissively licensed GitHub projects. Anyone can share a repository they find useful; a listing does not claim ownership or affiliation.</p><p>We check licenses on submission and refresh repository metadata daily. Contribution and maintenance preferences are provided by the person submitting the listing; GitHub archive status is shown separately.</p><p className="small muted">Permitted licences: {licenses.join(', ')}. We recommend MIT. <Link className="inline-link" to="/licences" onClick={() => setModal(null)}>Read our licence policy</Link>.</p><a className="button dark" href="https://docs.github.com/en/rest/repos/repos#get-a-repository" target="_blank" rel="noreferrer"><Code2 size={17}/> Powered by the GitHub API <ExternalLink size={14}/></a></Modal>}
  {deleting && <Modal title="Remove this listing?" close={() => setDeleting(null)}><p>This removes {deleting.fullName} from Nebula. The GitHub repository is unaffected.</p><button className="button primary full" onClick={async () => {try {await remove({id: deleting._id}); setDeleting(null); setToast('Listing removed.');} catch (e) {setToast(errorText(e));}}}>Remove listing</button></Modal>}
  {toast && <div role="status" className="toast"><Check size={17}/>{toast}<button onClick={() => setToast('')} className="icon-button" aria-label="Dismiss notification"><X size={16}/></button></div>}
  </>;
}

