import { Brand } from './shared/ui/Brand';
import React, { useState, useEffect, lazy, Suspense } from 'react';
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const EditorPage = lazy(() => import('./features/editor/EditorPage').then((module) => ({ default: module.EditorPage })));
import { Project } from './shared/types/template';
import { isSupabaseConfigured, supabase } from './shared/lib/supabaseClient';
const AuthPage = lazy(() => import('./features/auth/AuthPage').then((module) => ({ default: module.AuthPage })));
const PrivacyPage = lazy(() => import('./features/auth/PrivacyPage').then((module) => ({ default: module.PrivacyPage })));
import type { Session } from '@supabase/supabase-js';
import './shared/styles/tokens.css';

const AppContent: React.FC = () => {
  const isPrivacyPage = window.location.pathname.replace(/\/$/, '') === '/privacy';
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [openError, setOpenError] = useState('');

  useEffect(() => {
    if (!supabase || isPrivacyPage) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setAuthLoading(false);
      }
    }).catch(() => { if (active) setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (!nextSession) {
        setCurrentProject(null);
        setCurrentProjectId(null);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [isPrivacyPage]);

  const handleOpenProject = async (projectId: string) => {
    setLoading(true);
    setOpenError('');
    try {
      const { getProjects } = await import('./shared/data/projectService');
      const projects = await getProjects();
      const target = projects.find((p) => p.id === projectId);
      if (target) {
        setCurrentProject(target);
        setCurrentProjectId(projectId);
      } else {
        setOpenError('Progetto non trovato. Aggiorna la dashboard.');
      }
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : 'Impossibile aprire il progetto.');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const result = await supabase?.auth.signOut();
    if (result?.error) throw result.error;
  };

  const handleBackToDashboard = () => {
    setCurrentProjectId(null);
    setCurrentProject(null);
  };

  if (isPrivacyPage) return <PrivacyPage />;

  if (authLoading || loading) {
    return (
      <div className="app-loading" role="status">
        <Brand />
        <span>Caricamento in corso…</span>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) return <AuthPage />;

  if (currentProjectId && currentProject) {
    return (
      <EditorPage
        initialProject={currentProject}
        onBackToDashboard={handleBackToDashboard}
        onSignOut={isSupabaseConfigured ? handleSignOut : undefined}
      />
    );
  }

  return <DashboardPage key={session?.user.id || 'local'} userId={session?.user.id} onOpenProject={handleOpenProject} onSignOut={isSupabaseConfigured ? handleSignOut : undefined} openError={openError} />;
};

export const App: React.FC = () => (
  <Suspense fallback={<div className="app-loading" role="status"><Brand /><span>Caricamento in corso…</span></div>}>
    <AppContent />
  </Suspense>
);
export default App;
