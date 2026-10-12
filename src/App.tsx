import React, { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { Project } from './types/template';
import { getProjects } from './services/supabase/projectService';
import { isSupabaseConfigured, supabase } from './services/supabase/supabaseClient';
import { AuthPage } from './pages/AuthPage';
import { PrivacyPage } from './pages/PrivacyPage';
import type { Session } from '@supabase/supabase-js';
import './design-system/tokens.css';

export const App: React.FC = () => {
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
    await supabase?.auth.signOut();
  };

  const handleBackToDashboard = () => {
    setCurrentProjectId(null);
    setCurrentProject(null);
  };

  if (isPrivacyPage) return <PrivacyPage />;

  if (authLoading || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e2b', color: '#dfff2f' }}>
        Caricamento in corso...
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

  return <DashboardPage onOpenProject={handleOpenProject} onSignOut={isSupabaseConfigured ? handleSignOut : undefined} openError={openError} />;
};

export default App;
