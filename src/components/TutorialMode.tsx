import { getTutorials } from '../lib/referenceData';
import { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Award, Clock } from 'lucide-react';
import { Tutorial } from '../lib/supabase';

interface TutorialModeProps {
  onClose: () => void;
}

export function TutorialMode({ onClose }: TutorialModeProps) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionNotice, setCompletionNotice] = useState('');
  const [finished, setFinished] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('chemistry-tutorials') || '{}') as Record<
        string,
        { completed?: boolean }
      >;
      return Object.keys(stored).filter((id) => stored[id]?.completed);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      const data = await getTutorials();
      if (data) setTutorials(data as Tutorial[]);
    } catch (error) {
      console.error('Error loading tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const nextStep = () => {
    if (!selectedTutorial) return;

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    if (currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (!selectedTutorial) return;
    const completed = [...new Set([...finished, selectedTutorial.id])];
    setFinished(completed);
    setCompletionNotice('Guide complete. Progress saved in this browser.');
    try {
      localStorage.setItem(
        'chemistry-tutorials',
        JSON.stringify(Object.fromEntries(completed.map((id) => [id, { completed: true }]))),
      );
    } catch {
      setCompletionNotice(
        'Guide complete. Browser storage is unavailable, so progress will not survive a reload.',
      );
    }
    setSelectedTutorial(null);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-500/20 text-blue-400',
      organic: 'bg-green-500/20 text-green-400',
      inorganic: 'bg-purple-500/20 text-purple-400',
      physical: 'bg-orange-500/20 text-orange-400',
      analytical: 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tutorials...</p>
        </div>
      </div>
    );
  }

  if (selectedTutorial) {
    const step = selectedTutorial.steps[currentStep];
    const progress = ((currentStep + 1) / selectedTutorial.steps.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="container mx-auto px-6 py-8">
          <button
            onClick={onClose}
            className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
          >
            ← Back to Laboratory
          </button>

          <div className="bg-gray-900/50 backdrop-blur rounded-lg p-8 border border-gray-700">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{selectedTutorial.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span
                  className={`px-3 py-1 rounded-full border ${getDifficultyColor(selectedTutorial.difficulty_level)}`}
                >
                  {selectedTutorial.difficulty_level}
                </span>
                <span
                  className={`px-3 py-1 rounded-full ${getCategoryColor(selectedTutorial.category)}`}
                >
                  {selectedTutorial.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedTutorial.estimated_time} min
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>
                  {currentStep + 1} / {selectedTutorial.steps.length}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-6 min-h-[300px]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                  {currentStep + 1}
                </div>
                <h2 className="text-2xl font-bold">{step.title}</h2>
              </div>

              <p className="text-lg text-gray-300 leading-relaxed mb-6">{step.content}</p>

              {step.action && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm text-blue-400 font-semibold mb-1">
                    Suggested exploration (self-guided):
                  </div>
                  <div className="text-sm text-gray-300">{step.action.replace(/_/g, ' ')}</div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {currentStep === selectedTutorial.steps.length - 1 ? (
                <button
                  onClick={completeTutorial}
                  className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Complete Tutorial
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-6 flex gap-2 justify-center">
              {selectedTutorial.steps.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Go to step ${index + 1}`}
                  aria-current={index === currentStep ? 'step' : undefined}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-blue-500 w-6'
                      : completedSteps.includes(index)
                        ? 'bg-green-500'
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={onClose}
          className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
        >
          ← Back to Laboratory
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-400" />
            <div>
              <h2 className="text-3xl font-bold">Learning guides</h2>
              <p className="text-gray-400">
                Self-guided chemistry concepts · progress stored locally
              </p>
            </div>
          </div>
        </div>

        {completionNotice && (
          <p role="status" className="model-banner">
            {completionNotice}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <button
              type="button"
              key={tutorial.id}
              className="bg-gray-900/50 backdrop-blur rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group text-left"
              onClick={() => startTutorial(tutorial)}
            >
              {finished.includes(tutorial.id) && <span className="draft-tag mb-3">Completed</span>}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                  {tutorial.title}
                </h3>
                <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-3">{tutorial.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-2 py-1 rounded text-xs border ${getDifficultyColor(tutorial.difficulty_level)}`}
                >
                  {tutorial.difficulty_level}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${getCategoryColor(tutorial.category)}`}
                >
                  {tutorial.category}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {tutorial.estimated_time} min
                </span>
                <span>{tutorial.steps.length} steps</span>
              </div>

              {tutorial.objectives.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs font-semibold text-gray-400 mb-2">
                    Learning Objectives:
                  </div>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {tutorial.objectives.slice(0, 2).map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
