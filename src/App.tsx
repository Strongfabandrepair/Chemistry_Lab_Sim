import { useEffect, useRef, useState } from 'react';
import {
  Atom,
  FlaskConical,
  BookOpen,
  Activity,
  Droplets,
  ArrowUpRight,
  ChevronRight,
  HelpCircle,
  Layers3,
  PanelLeftClose,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { Laboratory, type LabView } from './components/Laboratory';

const navigation = [
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'molecules', label: 'Molecule library', icon: Atom },
  { id: 'spectroscopy', label: 'Spectroscopy', icon: Activity },
  { id: 'ph', label: 'pH analysis', icon: Droplets },
  { id: 'recipes', label: 'Experiment recipes', icon: Layers3 },
  { id: 'tutorials', label: 'Learning center', icon: BookOpen },
] as const;

export default function App() {
  const [view, setView] = useState<LabView>('lab');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const helpDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (help) helpDialog.current?.showModal();
    else helpDialog.current?.close();
  }, [help]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const selectView = (next: LabView) => {
    setView(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      {sidebarOpen && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside id="main-sidebar" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            selectView('lab');
          }}
        >
          <span className="brand-icon">
            <Atom size={25} />
          </span>
          <div>
            Quantum<span>CHEMISTRY LAB</span>
          </div>
        </a>
        <div className="workspace-select">
          <span className="workspace-avatar">Q</span>
          <div>
            Personal workspace<small>Local laboratory</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }, index) => (
            <div key={id}>
              {index === 4 && <div className="nav-caption resources-caption">RESOURCES</div>}
              <button
                aria-current={view === id ? 'page' : undefined}
                className={`nav-item ${view === id ? 'active' : ''}`}
                onClick={() => selectView(id)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {view === id && <span className="nav-active-dot" />}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-card">
            <div className="learning-icon">
              <FlaskConical size={18} />
            </div>
            <strong>
              A little curiosity.
              <br />A world of discovery.
            </strong>
            <p>
              Explore chemistry, one
              <br />
              experiment at a time.
            </p>
            <button onClick={() => selectView('tutorials')}>
              Start learning <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <HelpCircle size={16} /> Help & model guide <ArrowUpRight size={13} />
          </button>
          <div className="sidebar-version">
            <span className="tiny-dot" /> Educational edition <span>v1.1</span>
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              aria-controls="main-sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <PanelLeftClose size={16} className="desktop-menu" />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{navigation.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="session-indicator">
              <i /> Local session
            </span>
            <span className="avatar" title="Local Quantum workspace">
              QL
            </span>
          </div>
        </header>
        <Laboratory view={view} onViewChange={selectView} />
        <footer className="app-footer">
          <span>
            <ShieldCheck size={13} /> A safe space to explore. An educational model, not a
            real-world lab protocol.
          </span>
          <span>
            Made for curious minds <Atom size={13} />
          </span>
        </footer>
      </div>
      <dialog
        ref={helpDialog}
        className="help-modal panel"
        aria-label="Model guide"
        onClose={() => setHelp(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setHelp(false);
        }}
      >
        <h2>Your virtual lab, explained</h2>
        <p>
          Select elements, adjust their masses and conditions, then run a simulation. Recipes offer
          supported starting points.
        </p>
        <h3>What the model does</h3>
        <p>
          Seven curated two-element reactions use deterministic limiting-reactant stoichiometry and
          conserve mass. Elemental quantities are moles of atoms. Temperature is held constant.
          Energy is a reference estimate using standard formation enthalpies.
        </p>
        <h3>What it does not do</h3>
        <p>
          Activation thresholds are illustrative. Atmosphere, pressure-dependent equilibrium,
          catalysts, and reaction kinetics are not modeled. Molecular scenes use representative
          particles, not physical trajectories. Spectra and pH calculations are simplified
          educational estimates.
        </p>
        <p>
          Reference data is bundled locally. No account or database connection is required. Notes
          and tutorial completion are stored only in this browser.
        </p>
        <button autoFocus className="primary-button" onClick={() => setHelp(false)}>
          Got it
        </button>
      </dialog>
    </div>
  );
}
