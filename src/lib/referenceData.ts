import { supabase, type Element, type Molecule, type Tutorial } from './supabase';
import elementSeed from '../data/elements.json';
import moleculeSeed from '../data/molecules.json';
import tutorialSeed from '../data/tutorials.json';
import recipeSeed from '../data/recipes.json';

export const localElements = elementSeed as Element[];
export const localMolecules = moleculeSeed as Molecule[];
export type Recipe = (typeof recipeSeed)[number];

/** Remote data is optional; the bundled reference set always remains usable. */
async function readReference<T>(table: string, fallback: T[], order: string): Promise<T[]> {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order)
      .abortSignal(AbortSignal.timeout(5000));
    if (error || !data?.length) return fallback;
    return data as T[];
  } catch {
    return fallback;
  }
}
export const getElements = async () => {
  const remote = await readReference('elements', localElements, 'id');
  return localElements.map((local) => remote.find((element) => element.id === local.id) ?? local);
};
export const getMolecules = () => readReference('molecules', localMolecules, 'name');
export const getTutorials = () =>
  readReference('tutorials', tutorialSeed as Tutorial[], 'order_index');
export const getRecipes = () => readReference('recipes', recipeSeed, 'difficulty');
