import React, { useState, useEffect } from 'react';
import { Project } from '../types/template';
import { getProjects, saveProject, duplicateProject, deleteProject } from '../services/supabase/projectService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { createInitialProject, createDefaultSlide } from '../engine/defaultData';
import { Plus, Copy, Trash2, Edit3, Sparkles, Layers, Image as ImageIcon, Cloud, HardDrive } from 'lucide-react';

interface DashboardPageProps {
  onOpenProject: (projectId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'single' | 'carousel'>('carousel');
  const [newMode, setNewMode] = useState<'manual' | 'ai'>('manual');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const list = await getProjects();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async () => {
    const proj = createInitialProject(newType);
    if (newTitle.trim()) {
      proj.title = newTitle.trim();
    }
    if (newType === 'single') {
      proj.slides = [createDefaultSlide('cover')];
    }
    await saveProject(proj);
    setShowCreateModal(false);
    setNewTitle('');
    onOpenProject(proj.id);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateProject(id);
    loadAll();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questo progetto?')) {
      await deleteProject(id);
      loadAll();
    }
  };

  const handleStartRename = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditTitleText(proj.title);
  };

  const handleSaveRename = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitleText.trim()) {
      await saveProject({ ...proj, title: editTitleText.trim() });
      setEditingId(null);
      loadAll();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0e2b', padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ backgroundColor: '#dfff2f', color: '#10143d', fontFamily: "'Archivo Black', sans-serif", fontSize: 13, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                Liceo Gentileschi
              </span>
              <span style={{ color: '#8c95c8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                {isSupabaseConfigured ? (
                  <span style={{ color: '#20bf6b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Cloud size={14} /> Cloud Sincronizzato
                  </span>
                ) : (
                  <span style={{ color: '#f5cd79', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HardDrive size={14} /> Storage Locale
                  </span>
                )}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 32, color: '#ffffff', marginTop: 8, letterSpacing: '-0.02em' }}>
              Gentileschi Studio
            </h1>
            <p style={{ color: '#a0a8d4', fontSize: 14, marginTop: 4 }}>
              Generatore professionale di post singoli e caroselli Instagram per la rappresentanza studentesca.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: '#1728e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(23, 40, 232, 0.4)',
            }}
          >
            <Plus size={18} /> Nuovo Progetto
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#8c95c8' }}>
          Caricamento progetti in corso...
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#10143d', borderRadius: 12, border: '2px dashed #232a68' }}>
          <Layers size={40} color="#8c95c8" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#ffffff', fontSize: 18, marginBottom: 8 }}>Nessun progetto creato</h3>
          <p style={{ color: '#8c95c8', fontSize: 14, marginBottom: 20 }}>
            Inizia subito creando un post singolo o un carosello Instagram.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '10px 18px', backgroundColor: '#dfff2f', color: '#10143d', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
          >
            Crea il tuo primo post
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onOpenProject(proj.id)}
              style={{
                backgroundColor: '#10143d',
                border: '1px solid #232a68',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = '#304bff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#232a68';
              }}
            >
              {/* Preview card visual */}
              <div
                style={{
                  height: 180,
                  backgroundColor: '#1728e8',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`, backgroundSize: '12px 12px' }} />
                <div style={{ textAlign: 'center', padding: 20, zIndex: 2 }}>
                  <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 24, color: '#f4f0e6', textTransform: 'uppercase', display: 'block' }}>
                    {proj.slides[0]?.content && 'title' in proj.slides[0].content ? (proj.slides[0].content as any).title : proj.title}
                  </span>
                  <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 13, color: '#dfff2f', marginTop: 6, display: 'inline-block' }}>
                    {proj.type === 'carousel' ? `Carosello (${proj.slides.length} Slide)` : 'Post Singolo'}
                  </span>
                </div>
              </div>

              {/* Info & Actions */}
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {editingId === proj.id ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', backgroundColor: '#141842', border: '1px solid #304bff', borderRadius: 4, color: '#ffffff', fontSize: 13 }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(proj, e)}
                        style={{ padding: '4px 10px', backgroundColor: '#dfff2f', color: '#10143d', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700 }}
                      >
                        Salva
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        {proj.title}
                      </h3>
                      <span style={{ fontSize: 12, color: '#8c95c8', marginTop: 4, display: 'block' }}>
                        Modificato: {new Date(proj.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #192055' }}>
                  <button
                    type="button"
                    title="Rinomina"
                    onClick={(e) => handleStartRename(proj, e)}
                    style={{ background: 'none', border: 'none', color: '#8c95c8', cursor: 'pointer', padding: 4 }}
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    title="Duplica"
                    onClick={(e) => handleDuplicate(proj.id, e)}
                    style={{ background: 'none', border: 'none', color: '#8c95c8', cursor: 'pointer', padding: 4 }}
                  >
                    <Copy size={15} />
                  </button>

                  <button
                    type="button"
                    title="Elimina"
                    onClick={(e) => handleDelete(proj.id, e)}
                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 7, 24, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 480, backgroundColor: '#10143d', border: '1px solid #304bff', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#ffffff', margin: 0 }}>
              Crea Nuovo Progetto
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
                Titolo Progetto
              </label>
              <input
                type="text"
                placeholder="es. Assemblea Novembre 2026"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: '#141842', border: '1px solid #232a68', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
              />
            </div>

            {/* Type selector: Single vs Carousel */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
                Tipologia di Post
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setNewType('single')}
                  style={{
                    padding: 12,
                    backgroundColor: newType === 'single' ? '#1728e8' : '#141842',
                    border: newType === 'single' ? '2px solid #dfff2f' : '1px solid #232a68',
                    borderRadius: 8,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ImageIcon size={20} color={newType === 'single' ? '#dfff2f' : '#8c95c8'} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Post Singolo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewType('carousel')}
                  style={{
                    padding: 12,
                    backgroundColor: newType === 'carousel' ? '#1728e8' : '#141842',
                    border: newType === 'carousel' ? '2px solid #dfff2f' : '1px solid #232a68',
                    borderRadius: 8,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Layers size={20} color={newType === 'carousel' ? '#dfff2f' : '#8c95c8'} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Carosello (Multi-slide)</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 16px', background: 'none', border: '1px solid #232a68', color: '#8c95c8', borderRadius: 6, cursor: 'pointer' }}
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleCreate}
                style={{ padding: '10px 20px', backgroundColor: '#dfff2f', color: '#10143d', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Crea Progetto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
