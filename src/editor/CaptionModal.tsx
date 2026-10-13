import React, { useState } from "react";
import { Project } from "../types/template";
import { generateCaptionWithAi } from "../services/ai/geminiService";
import { X, Copy, Check, Sparkles, Loader2, MessageSquare } from "lucide-react";
import { useDialogFocus } from "./useDialogFocus";
import { visibleSlideText } from "../engine/scene";

interface CaptionModalProps {
  project: Project;
  onUpdateCaption: (caption: string) => void;
  onClose: () => void;
}

export const CaptionModal: React.FC<CaptionModalProps> = ({
  project,
  onUpdateCaption,
  onClose,
}) => {
  const [caption, setCaption] = useState(project.caption || "");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const dialogRef = useDialogFocus(onClose);

  const handleCopy = async () => {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateAiCaption = async () => {
    setIsGenerating(true);
    setErrorMsg("");

    // summarize slides
    const summary = project.slides
      .map((s, i) => {
        if (s.scene)
          return `Slide ${i + 1} (${s.templateType}): ${visibleSlideText(s).join("\n")}`;
        const { image: _image, ...textContent } =
          s.content as typeof s.content & { image?: unknown };
        return `Slide ${i + 1} (${s.templateType}): ${JSON.stringify(textContent)}`;
      })
      .join("\n");

    try {
      const generated = await generateCaptionWithAi(project.title, summary);
      setCaption(generated);
      onUpdateCaption(generated);
    } catch (err: any) {
      setErrorMsg(err.message || "Errore nella generazione della caption.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 24, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="caption-title"
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth: 580,
          backgroundColor: "#10143d",
          border: "1px solid #304bff",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={20} color="#dfff2f" />
            <h2
              id="caption-title"
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 20,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Caption Instagram
            </h2>
          </div>
          <button
            type="button"
            aria-label="Chiudi caption"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8c95c8",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{ fontSize: 13, color: "#a0a8d4", margin: 0, lineHeight: 1.4 }}
        >
          Copia il testo formattato o rigeneralo con l'intelligenza artificiale
          per accompagnare il tuo carosello su Instagram.
        </p>

        <textarea
          aria-label="Caption Instagram"
          rows={8}
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            onUpdateCaption(e.target.value);
          }}
          placeholder="Scrivi qui la tua caption per il post..."
          style={{
            width: "100%",
            padding: 14,
            backgroundColor: "#141842",
            border: "1px solid #232a68",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 14,
            lineHeight: 1.5,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#8c95c8",
          }}
        >
          <span>{caption.length} caratteri</span>
          {errorMsg && <span style={{ color: "#ff6b6b" }}>{errorMsg}</span>}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateAiCaption}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              backgroundColor: "#141842",
              color: "#dfff2f",
              border: "1px solid #dfff2f",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isGenerating ? "not-allowed" : "pointer",
            }}
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isGenerating ? "Generazione..." : "Rigenera con AI"}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              backgroundColor: isCopied ? "#20bf6b" : "#1728e8",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {isCopied ? "Copiata negli appunti!" : "Copia Testo"}
          </button>
        </div>
      </div>
    </div>
  );
};
