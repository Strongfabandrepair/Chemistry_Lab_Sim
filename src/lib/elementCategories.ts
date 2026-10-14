import type { Element } from './supabase';

export function elementCategory(el: Element) {
  if (el.id >= 57 && el.id <= 71) return 'Lanthanides';
  if (el.id >= 89 && el.id <= 103) return 'Actinides';
  if (el.group_number === 18) return 'Noble gases';
  if (el.group_number === 17) return 'Halogens';
  if (el.group_number === 1 && el.id !== 1) return 'Alkali metals';
  if (el.group_number === 2) return 'Alkaline earth';
  if ([5, 14, 32, 33, 51, 52].includes(el.id)) return 'Metalloids';
  if ([1, 6, 7, 8, 15, 16, 34].includes(el.id)) return 'Nonmetals';
  if (el.group_block === 'd') return 'Transition metals';
  return 'Post-transition';
}
export const categoryColors: Record<string, string> = {
  Nonmetals: '#70d4ad',
  'Noble gases': '#ae92da',
  'Alkali metals': '#d99d7f',
  'Alkaline earth': '#d2ba79',
  Metalloids: '#8bb6c9',
  Halogens: '#83bcbb',
  'Transition metals': '#80a5c4',
  'Post-transition': '#a2acb9',
  Lanthanides: '#c696b9',
  Actinides: '#b98d99',
};
