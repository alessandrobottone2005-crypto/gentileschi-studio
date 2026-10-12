import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Home,
  FolderOpen,
  Image,
  UserRound,
  Users,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  ArrowRight,
  Cloud,
  HardDrive,
} from 'lucide-react';
import {
  getProjects,
  countLocalProjectsToImport,
  importLocalProjects,
} from '../services/supabase/projectService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import {
  getProfile,
  getAuthors,
  LOCAL_USER_ID,
} from '../services/supabase/accountService';
import {
  getMediaLibrary,
  releaseLocalPreviews,
} from '../services/image/libraryService';
import type { StudioView } from '../types/studio';
import { useResource } from '../studio/useResource';
import {
  Avatar,
  EmptyProjects,
  ResourceError,
  roleLabel,
} from '../studio/StudioUi';
import { CreateProjectDialog } from '../studio/CreateProjectDialog';
import { ProjectList, isOwnProject } from '../studio/ProjectList';
import { MediaLibrary } from '../studio/MediaLibrary';
import { AccountPanel } from '../studio/AccountPanel';
import { UsersPanel } from '../studio/UsersPanel';
import '../design-system/studio.css';

interface DashboardPageProps {
  onOpenProject: (id: string) => void;
  onSignOut?: () => Promise<void>;
  openError?: string;
  userId?: string;
}
const loadProjects = () => getProjects({ hydrate: false });
const sections = [
  {
    id: 'overview',
    path: '/',
    label: 'Panoramica',
    icon: Home,
    title: 'Il tuo studio',
    description:
      'Uno spazio condiviso per dare forma alle prossime comunicazioni.',
  },
  {
    id: 'projects',
    path: '/projects',
    label: 'Progetti',
    icon: FolderOpen,
    title: 'Progetti dello studio',
    description: 'Tutti i lavori, condivisi con chi fa parte dello studio.',
  },
  {
    id: 'library',
    path: '/library',
    label: 'Libreria',
    icon: Image,
    title: 'Libreria fotografica',
    description:
      'Le foto dello studio, pronte da riutilizzare nei tuoi progetti.',
  },
  {
    id: 'account',
    path: '/account',
    label: 'Account',
    icon: UserRound,
    title: 'Il tuo account',
    description: 'Il tuo profilo e i tuoi contributi allo studio condiviso.',
  },
  {
    id: 'users',
    path: '/users',
    label: 'Utenti',
    icon: Users,
    title: 'Utenti dello studio',
    description: 'Le persone che lavorano qui e il ruolo di ciascuna.',
  },
] as const;
function currentView(): StudioView {
  return (
    sections.find(
      (section) =>
        section.path === window.location.pathname.replace(/\/$/, '') ||
        (section.path === '/' && window.location.pathname === '/'),
    )?.id || 'overview'
  );
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenProject,
  onSignOut,
  openError,
  userId = LOCAL_USER_ID,
}) => {
  const mainRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<StudioView>(currentView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [operationError, setOperationError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [importing, setImporting] = useState(false);
  const [localCount, setLocalCount] = useState(() => {
    try {
      return countLocalProjectsToImport();
    } catch {
      return 0;
    }
  });
  const profileLoader = useCallback(() => getProfile(userId), [userId]);
  const profile = useResource(profileLoader);
  const authors = useResource(getAuthors);
  const projects = useResource(loadProjects);
  const media = useResource(getMediaLibrary, releaseLocalPreviews);
  const local = !isSupabaseConfigured;
  const personal = (projects.data || []).filter((project) =>
    isOwnProject(project, userId, local),
  );
  const navigate = (next: StudioView) => {
    const path = sections.find((section) => section.id === next)!.path;
    if (window.location.pathname !== path)
      window.history.pushState(null, '', path);
    setView(next);
    setMenuOpen(false);
    window.scrollTo(0, 0);
    mainRef.current?.focus();
  };
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('studio-menu-toggle')?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);
  useEffect(() => {
    const pop = () => {
      setView(currentView());
      setMenuOpen(false);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const refresh = () => {
      void profile.reload();
      void authors.reload();
      void projects.reload();
      void media.reload();
    };
    window.addEventListener('focus', refresh);
    const timer = setInterval(
      () => {
        void media.reload();
      },
      50 * 60 * 1000,
    );
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, [profile.reload, authors.reload, projects.reload, media.reload]);
  const refreshProfile = () => {
    void profile.reload();
    void authors.reload();
  };
  const section = sections.find((section) => section.id === view)!;
  const shownProjects = (
    scope === 'mine' ? personal : projects.data || []
  ).filter((project) =>
    `${project.title} ${authors.data?.find((author) => author.id === project.userId)?.displayName || ''}`
      .toLocaleLowerCase('it')
      .includes(search.toLocaleLowerCase('it')),
  );
  const projectList = (list = projects.data || [], mine = false) =>
    projects.loading ? (
      <p role="status" className="studio-loading">
        Caricamento progetti…
      </p>
    ) : projects.error ? (
      <ResourceError message={projects.error} retry={projects.reload} />
    ) : list.length ? (
      <ProjectList
        projects={list}
        authors={authors.data || []}
        onOpen={onOpenProject}
        onChanged={projects.reload}
      />
    ) : (
      <EmptyProjects personal={mine} onCreate={() => setCreating(true)} />
    );
  const importLocal = async () => {
    setImporting(true);
    setOperationError('');
    try {
      await importLocalProjects();
      setLocalCount(countLocalProjectsToImport());
      await projects.reload();
      await media.reload();
    } catch (cause) {
      setOperationError(
        cause instanceof Error ? cause.message : 'Importazione non riuscita.',
      );
    } finally {
      setImporting(false);
    }
  };
  const signOut = async () => {
    if (!onSignOut || signingOut) return;
    setSigningOut(true);
    setOperationError('');
    try {
      await onSignOut();
    } catch {
      setOperationError('Uscita non riuscita. Riprova.');
      setSigningOut(false);
    }
  };
  return (
    <div className="studio-shell">
      <a href="#studio-main" className="studio-skip-link">
        Vai al contenuto
      </a>
      <header className="studio-mobile-header">
        <button
          type="button"
          id="studio-menu-toggle"
          className="studio-icon-button"
          aria-label={menuOpen ? 'Chiudi navigazione' : 'Apri navigazione'}
          aria-expanded={menuOpen}
          aria-controls="studio-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <span>
          GENTILESCHI <small>STUDIO</small>
        </span>
        <button
          type="button"
          className="studio-icon-button"
          aria-label="Vai al tuo account"
          onClick={() => navigate('account')}
        >
          <Avatar person={profile.data} size="small" />
        </button>
      </header>
      <aside
        className={`studio-sidebar ${menuOpen ? 'studio-sidebar-open' : ''}`}
      >
        <a
          href="/"
          className="studio-brand"
          onClick={(event) => {
            event.preventDefault();
            navigate('overview');
          }}
        >
          GENTILESCHI<span>STUDIO</span>
        </a>
        <nav id="studio-navigation" aria-label="Navigazione dello studio">
          {sections
            .filter(
              (item) => item.id !== 'users' || profile.data?.role === 'admin',
            )
            .map((item) => (
              <a
                key={item.id}
                href={item.path}
                aria-current={view === item.id ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigate(item.id);
                }}
              >
                <item.icon size={21} aria-hidden="true" />
                {item.label}
              </a>
            ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <span className="studio-storage-label">
            {local ? <HardDrive size={14} /> : <Cloud size={14} />}
            {local ? 'Su questo dispositivo' : 'Studio condiviso'}
          </span>
          <button
            type="button"
            className="studio-sidebar-account"
            onClick={() => navigate('account')}
          >
            <Avatar person={profile.data} size="small" />
            <span>
              <strong>{profile.data?.displayName || 'Il tuo account'}</strong>
              <small>
                {profile.data
                  ? roleLabel(profile.data.role)
                  : 'Caricamento profilo…'}
              </small>
            </span>
          </button>
          {onSignOut && (
            <button
              type="button"
              className="studio-signout"
              disabled={signingOut}
              onClick={signOut}
            >
              <LogOut size={16} />
              {signingOut ? 'Uscita…' : 'Esci dallo studio'}
            </button>
          )}
          <a href="/privacy" className="studio-privacy">
            Privacy
          </a>
        </div>
      </aside>
      <main
        ref={mainRef}
        id="studio-main"
        tabIndex={-1}
        className="studio-main"
      >
        <header className="studio-page-heading">
          <div>
            <h1>{section.title}</h1>
            <p>{section.description}</p>
          </div>
          {(view === 'overview' || view === 'projects') && (
            <button
              type="button"
              className="studio-button studio-button-lime"
              onClick={() => setCreating(true)}
            >
              <Plus size={18} />
              Nuovo progetto
            </button>
          )}
        </header>
        {(operationError || openError) && (
          <div role="alert" className="app-error">
            {operationError || openError}
          </div>
        )}
        {profile.error && (
          <ResourceError message={profile.error} retry={profile.reload} />
        )}
        {authors.error && (
          <ResourceError message={authors.error} retry={authors.reload} />
        )}
        {localCount > 0 && (view === 'projects' || view === 'overview') && (
          <div className="local-import-notice">
            <span>
              {localCount} progetti sono ancora su questo dispositivo. Puoi
              importarli nello studio condiviso.
            </span>
            <button type="button" disabled={importing} onClick={importLocal}>
              {importing ? 'Importazione…' : 'Importa progetti locali'}
            </button>
          </div>
        )}
        {view === 'overview' && (
          <>
            <section className="studio-overview-intro">
              <div>
                <h2>
                  {profile.data
                    ? `Ciao, ${profile.data.displayName.split(' ')[0]}.`
                    : 'Benvenuto nello studio.'}
                </h2>
                <p>
                  Dal primo testo al post pronto da pubblicare.
                  <br />
                  Crea un progetto o riprendi un lavoro dello studio.
                </p>
              </div>
              <button
                type="button"
                className="studio-text-button"
                onClick={() => navigate('account')}
              >
                Il tuo account
                <ArrowRight size={17} />
              </button>
            </section>
            <dl className="studio-stat-strip">
              <div>
                <dt>Progetti nello studio</dt>
                <dd>
                  {projects.loading || projects.error
                    ? '—'
                    : (projects.data?.length ?? '—')}
                </dd>
              </div>
              <div>
                <dt>Foto in libreria</dt>
                <dd>
                  {media.loading || media.error
                    ? '—'
                    : (media.data?.length ?? '—')}
                </dd>
              </div>
              <div>
                <dt>Il tuo ruolo</dt>
                <dd className="studio-stat-text">
                  {profile.data ? roleLabel(profile.data.role) : '—'}
                </dd>
              </div>
            </dl>
            {media.error && (
              <ResourceError message={media.error} retry={media.reload} />
            )}
            <section className="studio-section">
              <div className="studio-section-heading">
                <h2>Progetti recenti</h2>
                <button
                  type="button"
                  className="studio-text-button"
                  onClick={() => navigate('projects')}
                >
                  Vedi tutti
                  <ArrowRight size={17} />
                </button>
              </div>
              {projectList((projects.data || []).slice(0, 5))}
            </section>
            <div className="studio-overview-footer">
              <p>
                Le fotografie caricate restano disponibili anche quando elimini
                un progetto.
              </p>
              <button
                type="button"
                className="studio-text-button"
                onClick={() => navigate('library')}
              >
                Apri la libreria
                <ArrowRight size={17} />
              </button>
            </div>
          </>
        )}
        {view === 'projects' && (
          <>
            <div className="studio-toolbar">
              <label className="studio-search">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Cerca progetti"
                  placeholder="Cerca un progetto o un autore"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="studio-filters" aria-label="Filtra progetti">
                <button
                  type="button"
                  aria-pressed={scope === 'all'}
                  onClick={() => setScope('all')}
                >
                  Tutti
                </button>
                <button
                  type="button"
                  aria-pressed={scope === 'mine'}
                  onClick={() => setScope('mine')}
                >
                  Creati da me
                </button>
              </div>
              <button
                type="button"
                className="studio-text-button"
                onClick={projects.reload}
                disabled={projects.loading}
              >
                Aggiorna
              </button>
            </div>
            {!projects.loading &&
            !projects.error &&
            shownProjects.length === 0 &&
            search ? (
              <div className="studio-empty">
                <h2>Nessun progetto trovato</h2>
                <p>Prova un altro titolo o cambia il filtro.</p>
              </div>
            ) : (
              projectList(shownProjects, scope === 'mine')
            )}
          </>
        )}
        {view === 'library' && (
          <MediaLibrary
            assets={media.data}
            authors={authors.data || []}
            loading={media.loading}
            error={media.error}
            onReload={media.reload}
          />
        )}
        {view === 'account' && (
          <>
            {profile.loading && !profile.data ? (
              <p role="status" className="studio-loading">
                Caricamento profilo…
              </p>
            ) : (
              profile.data && (
                <AccountPanel
                  profile={profile.data}
                  projectsCount={
                    projects.loading || projects.error ? null : personal.length
                  }
                  photosCount={
                    media.loading || media.error
                      ? null
                      : (media.data || []).filter(
                          (asset) => asset.ownerId === userId,
                        ).length
                  }
                  onSaved={refreshProfile}
                />
              )
            )}
            {media.error && (
              <ResourceError message={media.error} retry={media.reload} />
            )}
            <section className="studio-section">
              <div className="studio-section-heading">
                <h2>I tuoi progetti</h2>
                <button
                  type="button"
                  className="studio-text-button"
                  onClick={() => {
                    setScope('mine');
                    setSearch('');
                    navigate('projects');
                  }}
                >
                  Vedi tutti
                  <ArrowRight size={17} />
                </button>
              </div>
              {projectList(personal.slice(0, 5), true)}
            </section>
          </>
        )}
        {view === 'users' &&
          (profile.loading ? (
            <p role="status" className="studio-loading">
              Verifica del ruolo…
            </p>
          ) : profile.data?.role === 'admin' ? (
            <UsersPanel currentId={userId} onRolesChanged={refreshProfile} />
          ) : (
            <div className="studio-empty">
              <h2>Gestione riservata agli amministratori</h2>
              <p>
                Il tuo account può lavorare su tutti i progetti dello studio.
              </p>
              <button
                type="button"
                className="studio-button"
                onClick={() => navigate('overview')}
              >
                Torna alla panoramica
              </button>
            </div>
          ))}
      </main>
      {creating && (
        <CreateProjectDialog
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            void projects.reload();
            onOpenProject(id);
          }}
        />
      )}
    </div>
  );
};
