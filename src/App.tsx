import React, { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { Project } from './types/template';
import { getProjects } from './services/supabase/projectService';
import './design-system/tokens.css';

export const App: React.FC = () => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenProject = async (projectId: string) => {
    setLoading(true);
    const projects = await getProjects();
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      setCurrentProject(target);
      setCurrentProjectId(projectId);
    }
    setLoading(false);
  };

  const handleBackToDashboard = () => {
    setCurrentProjectId(null);
    setCurrentProject(null);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e2b', color: '#dfff2f' }}>
        Caricamento in corso...
      </div>
    );
  }

  if (currentProjectId && currentProject) {
    return (
      <EditorPage
        initialProject={currentProject}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return <DashboardPage onOpenProject={handleOpenProject} />;
};

export default App;
