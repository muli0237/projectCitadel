import React, { useState } from 'react';
import {
  FolderGit2,
  GitBranch,
  Search,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Code2,
  Plus,
} from 'lucide-react';
import { useCitadelStore } from '../../../../store/useCitadelStore';
import { Project } from '../../../../types';
import codeLabImg from '../../../../assets/images/tactical_code_lab_1788363342439.jpg';

interface ProjectsPanelProps {
  projects: Project[];
  onOpenTerminal: () => void;
  onOpenCodeLab?: () => void;
}

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  projects,
  onOpenTerminal,
}) => {
  const { activeProject, setActiveProject, setActiveModule, showToast } = useCitadelStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Security', 'Infra', 'DevOps', 'Data', 'Research'];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectProject = async (p: Project) => {
    await setActiveProject(p.id);
    showToast({
      type: 'success',
      title: `Workspace Activated: ${p.name}`,
      message: `Active path set to ${p.path}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Real Workspace Code Lab Banner */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#040915]">
        <div className="h-28 w-full relative">
          <img
            src={codeLabImg}
            alt="Citadel Tactical Code Lab"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-85 filter saturate-[1.15] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040915] via-[#040915]/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold backdrop-blur-xs">
              {projects.length} REPOSITORIES MOUNTED
            </span>
          </div>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Isolated Project Workspaces
            </h3>
            <p className="text-[11px] font-mono text-cyan-300">
              Active Target:{' '}
              <span className="text-white font-semibold">
                {activeProject?.name || 'CITADEL Core Repository'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040915] p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 bg-[#060e1d] border border-slate-700/60 rounded-md px-3 py-1.5 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search workspace projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-hidden w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isActive = activeProject?.id === project.id;
            return (
              <div
                key={project.id}
                className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#081329] border-cyan-500/50 shadow-xs'
                    : 'bg-[#040915] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderGit2
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                      <h4 className="text-xs font-semibold text-white truncate">
                        {project.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {project.category}
                      </span>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Branch and Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono mb-3">
                    <div className="flex items-center gap-1 text-slate-400 bg-[#060e1d] px-2 py-0.5 rounded border border-slate-800">
                      <GitBranch className="w-3 h-3 text-cyan-400" />
                      <span>{project.gitBranch}</span>
                    </div>

                    {project.virtualenvActive && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                        venv: active
                      </span>
                    )}

                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[160px]">
                    {project.path}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isActive ? (
                      <button
                        onClick={() => handleSelectProject(project)}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs rounded transition-colors cursor-pointer"
                      >
                        Set Active
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveModule('code-lab')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#0a162e] hover:bg-[#0e2042] border border-cyan-500/40 text-cyan-300 text-xs rounded transition-colors cursor-pointer"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Code Lab</span>
                      </button>
                    )}

                    <button
                      onClick={onOpenTerminal}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Open Terminal in this directory"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-8 text-slate-400 text-xs font-mono">
            No projects found matching current search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
