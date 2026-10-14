import { ArrowLeft, Download, Sparkles, MessageSquare, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { Brand } from "../../../shared/ui/Brand";

export function EditorHeader({ title, onTitle, onBack, onSignOut, saveStatus, onAi, onCaption, onExport }: {
  title: string;
  onTitle: (title: string) => void;
  onBack: () => void;
  onSignOut?: () => void;
  saveStatus: "saved" | "saving" | "error" | "conflict";
  onAi: () => void;
  onCaption: () => void;
  onExport: () => void;
}) {
  return (
    <header className="editor-header">
      <div className="editor-header-main">
        <button type="button" onClick={onBack} aria-label="Torna alla dashboard" className="editor-back">
          <ArrowLeft size={16} /><Brand variant="compact" /><span className="dashboard-label">Dashboard</span>
        </button>
        <input className="editor-project-title" type="text" aria-label="Titolo progetto" value={title} onChange={(event) => onTitle(event.target.value)} />
        <div className="save-indicator" role="status">
          {saveStatus === "saved" ? <CheckCircle2 size={14} /> : saveStatus === "saving" ? <RefreshCw size={14} className="animate-spin" /> : <AlertCircle size={14} />}
          <span>{saveStatus === "saved" ? "Salvato" : saveStatus === "saving" ? "Salvataggio..." : "Non salvato"}</span>
        </div>
        {onSignOut && <button type="button" onClick={onSignOut} className="editor-signout" aria-label="Esci dall’account">Esci</button>}
      </div>
      <div className="editor-header-actions">
        <button type="button" className="studio-button" onClick={onAi}><Sparkles size={15} /> Assistente AI</button>
        <button type="button" className="studio-button" onClick={onCaption}><MessageSquare size={15} /> Caption</button>
        <button type="button" className="studio-button studio-button-primary" onClick={onExport}><Download size={15} /> Esporta</button>
      </div>
    </header>
  );
}
