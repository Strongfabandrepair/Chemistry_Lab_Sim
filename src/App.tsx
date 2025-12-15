import { useState } from 'react';
import { FlaskConical, BookOpen, Beaker, Activity } from 'lucide-react';
import { Laboratory } from './components/Laboratory';
import { TutorialMode } from './components/TutorialMode';
import { Tutorial } from './lib/supabase';

type AppMode = 'laboratory' | 'tutorial';

function App() {
  const [mode, setMode] = useState<AppMode>('laboratory');
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);

  const handleLoadTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
  };

  if (mode === 'tutorial') {
    return (
      <TutorialMode
        onClose={() => setMode('laboratory')}
        onLoadTutorial={handleLoadTutorial}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Quantum Chemistry Laboratory</h1>
                <p className="text-sm text-gray-400">Research-Grade Molecular Simulator</p>
              </div>
            </div>

            <nav className="flex gap-3">
              <button
                onClick={() => setMode('laboratory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === 'laboratory'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Beaker className="w-5 h-5" />
                Laboratory
              </button>
              <button
                onClick={() => setMode('tutorial')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === 'tutorial'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Tutorials
              </button>
            </nav>
          </div>
        </div>
      </header>

      <Laboratory />
    </div>
  );
}

export default App;
