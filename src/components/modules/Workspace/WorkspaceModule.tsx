import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Pin,
  Terminal,
  Search,
  Code,
  Folder,
  Layers,
  LayoutDashboard,
  Shield,
  Container,
  Database,
  GitBranch,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge } from '../../../services/tauriBridge';
import { Project, ProjectCategory } from '../../../types';
import { WorkspaceDashboard } from './WorkspaceDashboard';

// Bounded local vector image assets
import secopsCardSvg from '../../../assets/images/card_secops_vector.svg';
import devopsCardSvg from '../../../assets/images/card_devops_vector.svg';
import datascienceCardSvg from '../../../assets/images/card_datascience_vector.svg';
import codelabCardSvg from '../../../assets/images/card_code_lab_vector.svg';
import emptyStateSvg from '../../../assets/images/empty_state_illustration.svg';

const CATEGORIES: ProjectCategory[] = [
  'Security',
  'DevOps',
  'Software',
  'Data Science',
  'Research',
  'General',
];

const getCategoryMedia = (category: string) => {
  switch (category) {
    case 'Security':
      return {
        svg: secopsCardSvg,
        alt: 'Security operations',
        badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
        icon: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
      };
    case 'DevOps':
      return {
        svg: devopsCardSvg,
        alt: 'DevOps control',
        badgeBg: 'bg-violet-950/80 text-violet-300 border-violet-500/30',
        icon: <Container className="w-3.5 h-3.5 text-violet-400" />,
      };
    case 'Data Science':
      return {
        svg: datascienceCardSvg,
        alt: 'Data science',
        badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
        icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
      };
    case 'Software':
    default:
      return {
        svg: codelabCardSvg,
        alt: 'Software development',
        badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/30',
        icon: <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />,
      };
  }
};

export const WorkspaceModule: React.FC = () => {
  const {
    activeProject,
    setActiveProject,
    workspace,
    createTerminalTab,
    setActiveModule,
    showToast,
  } = useCitadelStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Project Form State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectCategory>('Security');
  const [newTags, setNewTags] = useState('');
  const [newShell, setNewShell] = useState('Kali Shell');

  const loadProjects = async () => {
    const list = await bridge.listProjects();
    setProjects(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = await bridge.createProject({
      name: newName,
      description: newDescription,
      category: newCategory,
      tags: tagsArray,
      preferredShellProfile: newShell,
    });

    setIsModalOpen(false);
    setNewName('');
    setNewDescription('');
    setNewTags('');
    await loadProjects();
    setActiveProject(created.id);
    showToast({
      type: 'success',
      title: 'Project Initialized',
      message: `Created portable directory structure for ${created.name}`,
    });
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await bridge.togglePinProject(id);
    await loadProjects();
  };

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent font-sans text-slate-200 relative">
      {/* Calm Top Sub-Navigation Bar */}
      <nav 
        aria-label="Workspace Navigation"
        className="h-12 bg-[#050b18]/90 border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between shrink-0 z-20 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#0a162e] text-cyan-300 border border-cyan-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Observability Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#0a162e] text-cyan-300 border border-cyan-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Portable Projects ({projects.length})</span>
          </button>
        </div>

        {/* DEMO DATA / ENCLAVE SIMULATION BADGE */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            DEMO DATA // AIR-GAP ENCLAVE
          </span>
        </div>
      </nav>

      {/* Main View Area */}
      {activeTab === 'dashboard' ? (
        <WorkspaceDashboard
          onNavigateModule={(mod: any) => setActiveModule(mod)}
          onLaunchProject={(id: string) => {
            setActiveProject(id);
            setActiveTab('projects');
          }}
          activeProject={activeProject}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#071124]/90 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#040915] border border-slate-800 text-cyan-400">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">
                  Portable Projects Manager
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                  Mount Root: {workspace?.rootPath || '/media/kali/CITADEL_DRIVE/Citadel/workspace'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>

          {/* Directory Layout Structure Card */}
          <div className="bg-[#071124]/90 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  Self-Contained Portable Directory Structure
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Isolated host environment
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs font-mono">
              <div className="p-2 rounded-md bg-[#040915] border border-slate-800 text-slate-300 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>/projects</span>
              </div>
              <div className="p-2 rounded-md bg-[#040915] border border-slate-800 text-slate-300 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>/notes</span>
              </div>
              <div className="p-2 rounded-md bg-[#040915] border border-slate-800 text-slate-300 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-emerald-400" />
                <span>/datasets</span>
              </div>
              <div className="p-2 rounded-md bg-[#040915] border border-slate-800 text-slate-300 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-blue-400" />
                <span>/tool-profiles</span>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-[#071124]'
                }`}
              >
                All Categories
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-[#071124]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#071124] border border-slate-800 rounded-md max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const isActive = activeProject?.id === project.id;
                const treatment = getCategoryMedia(project.category);

                return (
                  <article
                    key={project.id}
                    onClick={() => setActiveProject(project.id)}
                    className={`border rounded-lg flex flex-col justify-between cursor-pointer transition-colors overflow-hidden relative shadow-xs ${
                      isActive
                        ? 'bg-[#09152e] border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'bg-[#071124]/90 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Media Header with controlled opacity */}
                    <div className="relative h-20 w-full bg-[#050c1c] overflow-hidden border-b border-slate-800/80">
                      <img
                        src={treatment.svg}
                        alt={treatment.alt}
                        className="w-full h-full object-cover opacity-35"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071124] via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center gap-1 ${treatment.badgeBg}`}>
                          {treatment.icon}
                          <span>{project.category}</span>
                        </span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          onClick={(e) => handleTogglePin(project.id, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            project.pinned
                              ? 'text-cyan-400 bg-cyan-950 border border-cyan-500/30'
                              : 'text-slate-400 hover:text-slate-200 bg-black/40'
                          }`}
                          title={project.pinned ? 'Pinned Project' : 'Pin Project'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {project.name}
                          </h3>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold rounded-sm">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                          {project.description || 'Self-contained workspace module with isolated sandbox profile.'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mb-3">
                          <div className="p-1.5 bg-[#040915] border border-slate-800 rounded-md">
                            <span className="text-slate-400 block text-[9px]">GIT BRANCH</span>
                            {project.gitBranch ? (
                              <span className="text-cyan-300 font-medium truncate block">{project.gitBranch}</span>
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}
                          </div>
                          <div className="p-1.5 bg-[#040915] border border-slate-800 rounded-md">
                            <span className="text-slate-400 block text-[9px]">VIRTUALENV</span>
                            {project.hasVirtualEnv ? (
                              <span className="text-emerald-400 font-medium block">Active</span>
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}
                          </div>
                        </div>

                        {project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded-sm bg-[#040915] border border-slate-800 text-[10px] font-mono text-slate-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="truncate max-w-[130px]">
                          {project.preferredShellProfile || 'Default Shell'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createTerminalTab(project.preferredShellProfile as any || 'Project Shell');
                              setActiveModule('terminal-deck');
                            }}
                            className="p-1.5 rounded-md bg-[#081326] hover:bg-slate-800 text-cyan-400 border border-slate-700/60 cursor-pointer"
                            title="Launch Shell"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveProject(project.id);
                              setActiveModule('code-lab');
                            }}
                            className="p-1.5 rounded-md bg-[#081326] hover:bg-slate-800 text-slate-300 border border-slate-700/60 cursor-pointer"
                            title="Open in Code Lab"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-16 rounded-lg border border-slate-800/80 bg-[#071124]/60 flex flex-col items-center justify-center space-y-3 text-center p-6">
              <img
                src={emptyStateSvg}
                alt="No projects match"
                className="w-40 h-28 object-contain opacity-40"
              />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  No Matching Projects Found
                </h3>
                <p className="text-xs text-slate-400">
                  Try adjusting the category or search keywords.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-[#081326] border border-slate-700 text-slate-300 text-xs rounded-md hover:bg-slate-800 transition-colors"
                >
                  Reset Filter
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Create New Project
                </button>
              </div>
            </div>
          )}

          {/* Create Project Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-[#071124] border border-slate-700 rounded-lg max-w-lg w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <h2 className="text-base font-semibold text-white">
                    Create Portable Project
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Citadel-Security-Audit"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[#040915] border border-slate-800 text-slate-200 focus:border-cyan-400 focus:outline-hidden font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Project scope, objectives, or testing parameters..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[#040915] border border-slate-800 text-slate-200 focus:border-cyan-400 focus:outline-hidden text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as ProjectCategory)}
                        className="w-full px-3 py-2 rounded-md bg-[#040915] border border-slate-800 text-slate-200 focus:border-cyan-400 focus:outline-hidden font-mono text-xs"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Shell Profile
                      </label>
                      <select
                        value={newShell}
                        onChange={(e) => setNewShell(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-[#040915] border border-slate-800 text-slate-200 focus:border-cyan-400 focus:outline-hidden font-mono text-xs"
                      >
                        <option value="Kali Shell">Kali Shell (Root)</option>
                        <option value="Project Shell">Project Sandbox Shell</option>
                        <option value="Git Shell">Git Environment Shell</option>
                        <option value="Python Environment">Python Virtualenv</option>
                        <option value="Container Shell">Container Daemon</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="nmap, audit, web, forensics"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[#040915] border border-slate-800 text-slate-200 focus:border-cyan-400 focus:outline-hidden font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 font-sans">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-md bg-[#081326] hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium cursor-pointer"
                    >
                      Initialize Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceModule;
