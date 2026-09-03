import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Search,
  CheckCircle2,
  Tag,
  Clock,
  Pin,
  FolderOpen,
  Layers,
  BookOpen,
  Shield,
  Zap,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge } from '../../../services/tauriBridge';
import { Note } from '../../../types';
import { StatusPill } from '../../common/StatusPill';

const TEMPLATES: { label: Note['templateType']; defaultTitle: string; content: string }[] = [
  {
    label: 'Incident Note',
    defaultTitle: 'Incident Response Investigation',
    content: `# INCIDENT INVESTIGATION LOG
**Date/Time:** ${new Date().toISOString()}
**Investigator:** Security Operator
**Target Scope:** Internal Segment

## 1. Initial Indicator of Compromise (IoC)
- Time observed: 
- Description:

## 2. Containment Actions Taken
- [ ] Network segment isolated
- [ ] Volatile memory & socket dumps captured
- [ ] Active sessions terminated

## 3. Findings & Evidence
`,
  },
  {
    label: 'Deployment Checklist',
    defaultTitle: 'Pre-Engagement Deployment Checklist',
    content: `# DEPLOYMENT PRE-FLIGHT CHECKLIST

- [ ] Verify written Authorization & Rules of Engagement
- [ ] Confirm portable drive write permissions & free disk space (>5GB)
- [ ] Test PTY terminal shell spawn under Kali root
- [ ] Check Docker daemon / Podman container status
- [ ] Verify network interface isolation
`,
  },
  {
    label: 'Lab Runbook',
    defaultTitle: 'Defensive Lab Procedure',
    content: `# DEFENSIVE OPERATIONS LAB RUNBOOK

## Objective
Verify detection fidelity for port and vulnerability scanning.

## Execution Steps
1. Launch Nmap scan with service detection
2. Inspect Suricata alert timeline
3. Correlate timestamps with system journal
`,
  },
  {
    label: 'Project Handoff',
    defaultTitle: 'Assessment Handoff Summary',
    content: `# PROJECT ENGAGEMENT HANDOFF

**Project:** 
**Status:** In Progress

### Summary of Completed Milestones
1. Initial host discovery complete
2. No critical remote vulnerabilities observed

### Next Steps
- Export SQLite audit logs to USB backup archive
`,
  },
];

export const NotesRunbooks: React.FC = () => {
  const { activeProject, showToast, showConfirmation } = useCitadelStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Active Note edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  const loadNotes = async () => {
    const list = await bridge.listNotes();
    setNotes(list);
    if (list.length > 0 && !selectedNoteId) {
      setSelectedNoteId(list[0].id);
      populateEditor(list[0]);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const populateEditor = (note: Note) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setIsSaved(true);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    populateEditor(note);
  };

  const handleCreateNoteFromTemplate = async (template: typeof TEMPLATES[0]) => {
    const newNote = await bridge.saveNote({
      id: `note-${Date.now()}`,
      title: template.defaultTitle,
      content: template.content,
      templateType: template.label,
      tags: ['audit', 'enclave'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: activeProject?.id,
      pinned: false,
    });

    await loadNotes();
    setSelectedNoteId(newNote.id);
    populateEditor(newNote);
    showToast({
      type: 'success',
      title: 'Runbook Created',
      message: `Created note from template: ${template.label}`,
    });
  };

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;
    const existing = notes.find((n) => n.id === selectedNoteId);
    if (!existing) return;

    const updatedNote: Note = {
      ...existing,
      title: editTitle,
      content: editContent,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    await bridge.saveNote(updatedNote);
    await loadNotes();
    setIsSaved(true);
    showToast({
      type: 'success',
      title: 'Note Saved',
      message: 'Persisted runbook changes to enclave storage.',
    });
  };

  const handleDeleteNote = (noteId: string) => {
    showConfirmation({
      title: 'Delete Runbook Note?',
      message: 'This will permanently remove this markdown document from your portable USB storage.',
      confirmLabel: 'Delete Note',
      isDestructive: true,
      onConfirm: async () => {
        await bridge.deleteNote(noteId);
        await loadNotes();
        if (selectedNoteId === noteId) {
          setSelectedNoteId('');
          setEditTitle('');
          setEditContent('');
        }
        showToast({
          type: 'warning',
          title: 'Note Deleted',
          message: 'Runbook file removed.',
        });
      },
    });
  };

  const filteredNotes = notes.filter((n) => {
    return (
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative">
      <div className="relative z-10 space-y-6">
        {/* 1. CyberGuard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#071126]/90 border border-cyan-500/30 rounded-md p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xs bg-amber-950/80 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-oxanium font-bold text-white uppercase tracking-[0.15em]">
                Runbooks, Checklists & Tactical Notes
              </h1>
              <StatusPill status="healthy" label="ENCRYPTED LOCAL" />
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Zero-leakage local markdown runbooks • Automatic timestamped change audit
            </p>
          </div>
        </div>

        {/* Template Quick Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TEMPLATES.slice(0, 2).map((tmpl) => (
            <button
              key={tmpl.label}
              onClick={() => handleCreateNoteFromTemplate(tmpl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#030917] hover:bg-[#0a1630] border border-cyan-950 text-cyan-300 text-xs font-mono font-bold whitespace-nowrap transition-colors"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>+ {tmpl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Notes Explorer and Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Note List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#071126] border border-cyan-500/30 rounded-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search runbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3.5 rounded-xs border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#09152e] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-[#071126] border-cyan-950 hover:border-cyan-500/40 hover:bg-[#0a1733]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-xs font-bold font-mono text-white truncate">
                      {note.title}
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {note.templateType}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                    {note.content.slice(0, 90)}...
                  </p>

                  <div className="pt-2 border-t border-cyan-950 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    <span className="text-cyan-400">{note.tags.join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Markdown Editor (8 cols) */}
        <div className="lg:col-span-8 bg-[#071126] border border-cyan-500/30 rounded-md p-5 space-y-4">
          {selectedNote ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-950">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setIsSaved(false);
                  }}
                  className="bg-transparent border-none text-base font-bold font-oxanium text-white focus:outline-hidden flex-1"
                  placeholder="Runbook Title..."
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Runbook</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1.5 rounded-xs bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/40 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags Editor */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => {
                    setEditTags(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="Tags (comma-separated)..."
                  className="bg-[#030917] border border-cyan-950 rounded-xs px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500/50 flex-1"
                />
              </div>

              {/* Markdown Body Textarea */}
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  setIsSaved(false);
                }}
                rows={16}
                className="w-full bg-[#020612] border border-cyan-950 rounded-xs p-3 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500/50 leading-relaxed resize-y"
                placeholder="# Enter markdown content..."
              />
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 font-mono text-xs">
              Select or create a runbook note from the sidebar.
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
