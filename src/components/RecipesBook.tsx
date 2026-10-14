import { useEffect, useState } from 'react';
import { BookOpen, Flame, AlertCircle, Beaker } from 'lucide-react';
import { getRecipes, type Recipe } from '../lib/referenceData';

interface RecipesBookProps {
  onLoadRecipe: (recipe: Recipe) => void;
}

export function RecipesBook({ onLoadRecipe }: RecipesBookProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    console.log('Loading recipes from database...');
    try {
      const data = await getRecipes();
      setRecipes(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Exception loading recipes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  const categories = ['all', ...new Set(recipes.map((r) => r.category))];

  const filteredRecipes =
    selectedCategory === 'all' ? recipes : recipes.filter((r) => r.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-900/30 text-green-400 border-green-500/50';
      case 'intermediate':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
      case 'advanced':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Synthesis':
        return <Beaker className="w-4 h-4" />;
      case 'Combustion':
        return <Flame className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur rounded-lg border border-gray-700 p-8">
        <div className="text-white text-center">Loading recipes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur rounded-lg border border-gray-700 p-8">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading recipes</div>
          <div className="text-gray-400 text-sm">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadRecipes();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Known Recipes</h2>
            <p className="text-xs text-gray-400">
              Pre-configured chemical reactions for demonstrations
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(recipe.category)}
                    <h3 className="font-semibold text-white">{recipe.name}</h3>
                  </div>
                  <p className="text-xs text-gray-400">{recipe.description}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs border ${getDifficultyColor(recipe.difficulty)}`}
                >
                  {recipe.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {recipe.temperature.toFixed(0)} K
                </div>
                <div>{recipe.ingredients.length} ingredients</div>
              </div>

              {recipe.safety_notes && recipe.safety_notes.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-300">
                      {recipe.safety_notes[0]}
                      {recipe.safety_notes.length > 1 && (
                        <button
                          onClick={() =>
                            setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)
                          }
                          className="ml-1 text-yellow-400 hover:underline"
                        >
                          {expandedRecipe === recipe.id
                            ? 'Less'
                            : `+${recipe.safety_notes.length - 1} more`}
                        </button>
                      )}
                    </div>
                  </div>
                  {expandedRecipe === recipe.id && (
                    <ul className="mt-2 space-y-1 text-xs text-yellow-300 ml-5">
                      {recipe.safety_notes.slice(1).map((note, i) => (
                        <li key={i}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button
                onClick={() => onLoadRecipe(recipe)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded transition-colors"
              >
                Load Recipe
              </button>
            </div>
          </div>
        ))}

        {filteredRecipes.length === 0 && (
          <div className="text-center text-gray-400 py-8">No recipes found in this category</div>
        )}
      </div>
    </div>
  );
}
