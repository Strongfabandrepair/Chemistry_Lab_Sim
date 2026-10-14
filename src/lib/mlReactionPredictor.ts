import { Element, Molecule } from './supabase';

interface ReactionPrediction {
  products: Array<{
    formula: string;
    name: string;
    probability: number;
    mechanism: string;
  }>;
  confidence: number;
  reactionType: string;
  conditions: {
    temperature: number;
    catalyst?: string;
    solvent?: string;
  };
}

interface ReactionPattern {
  reactantTypes: string[];
  productTypes: string[];
  conditions: { temperature?: number; catalyst?: string; solvent?: string; light?: boolean };
  probability: number;
  mechanism: string;
}

export class MLReactionPredictor {
  private reactionDatabase: ReactionPattern[] = [
    {
      reactantTypes: ['alkene', 'H2'],
      productTypes: ['alkane'],
      conditions: { catalyst: 'Pt or Pd', temperature: 298 },
      probability: 0.95,
      mechanism: 'Catalytic hydrogenation'
    },
    {
      reactantTypes: ['alcohol', 'carboxylic_acid'],
      productTypes: ['ester', 'water'],
      conditions: { catalyst: 'H+ acid', temperature: 350 },
      probability: 0.85,
      mechanism: 'Fischer esterification'
    },
    {
      reactantTypes: ['alkane', 'halogen'],
      productTypes: ['alkyl_halide'],
      conditions: { light: true, temperature: 298 },
      probability: 0.80,
      mechanism: 'Free radical halogenation'
    },
    {
      reactantTypes: ['alkene', 'HX'],
      productTypes: ['alkyl_halide'],
      conditions: { temperature: 298 },
      probability: 0.90,
      mechanism: 'Electrophilic addition (Markovnikov)'
    },
    {
      reactantTypes: ['aromatic', 'NO2+'],
      productTypes: ['nitroaromatic'],
      conditions: { catalyst: 'H2SO4', temperature: 323 },
      probability: 0.88,
      mechanism: 'Electrophilic aromatic substitution'
    },
    {
      reactantTypes: ['carbonyl', 'nucleophile'],
      productTypes: ['alcohol'],
      conditions: { temperature: 273 },
      probability: 0.92,
      mechanism: 'Nucleophilic addition'
    },
    {
      reactantTypes: ['carboxylic_acid', 'base'],
      productTypes: ['carboxylate_salt', 'water'],
      conditions: { temperature: 298 },
      probability: 0.98,
      mechanism: 'Acid-base neutralization'
    },
    {
      reactantTypes: ['alkyne', 'H2O'],
      productTypes: ['ketone'],
      conditions: { catalyst: 'Hg2+, H2SO4', temperature: 333 },
      probability: 0.82,
      mechanism: 'Hydration (Markovnikov)'
    }
  ];

  predictReaction(
    reactants: Array<Molecule | Element>,
    conditions: { temperature: number; pressure: number; catalyst?: string }
  ): ReactionPrediction {
    const functionalGroups = this.extractFunctionalGroups(reactants);
    const elementSymbols = this.extractElementSymbols(reactants);

    const matchingPatterns = this.findMatchingPatterns(functionalGroups, elementSymbols);

    if (matchingPatterns.length === 0) {
      return this.predictGenericReaction(reactants, conditions);
    }

    const bestMatch = matchingPatterns[0];
    const products = this.generateProducts(reactants, bestMatch, conditions);

    return {
      products,
      confidence: bestMatch.probability,
      reactionType: this.classifyReactionType(functionalGroups, elementSymbols),
      conditions: {
        temperature: bestMatch.conditions.temperature || conditions.temperature,
        catalyst: bestMatch.conditions.catalyst,
        solvent: bestMatch.conditions.solvent
      }
    };
  }

  private extractFunctionalGroups(reactants: Array<Molecule | Element>): string[] {
    const groups: string[] = [];

    for (const reactant of reactants) {
      if ('functional_groups' in reactant) {
        groups.push(...reactant.functional_groups);
      }
    }

    return [...new Set(groups)];
  }

  private extractElementSymbols(reactants: Array<Molecule | Element>): string[] {
    const symbols: string[] = [];

    for (const reactant of reactants) {
      if ('symbol' in reactant) {
        symbols.push(reactant.symbol);
      } else if ('formula' in reactant) {
        const matches = reactant.formula.match(/[A-Z][a-z]?/g);
        if (matches) symbols.push(...matches);
      }
    }

    return [...new Set(symbols)];
  }

  private findMatchingPatterns(
    functionalGroups: string[],
    elementSymbols: string[]
  ): ReactionPattern[] {
    const matches: Array<ReactionPattern & { score: number }> = [];

    for (const pattern of this.reactionDatabase) {
      let score = 0;

      for (const requiredType of pattern.reactantTypes) {
        if (functionalGroups.includes(requiredType)) {
          score += 1;
        }

        if (elementSymbols.some(s => requiredType.includes(s))) {
          score += 0.5;
        }
      }

      if (score > 0) {
        matches.push({ ...pattern, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score).map(pattern => ({ reactantTypes: pattern.reactantTypes, productTypes: pattern.productTypes, conditions: pattern.conditions, probability: pattern.probability, mechanism: pattern.mechanism }));
  }

  private generateProducts(
    reactants: Array<Molecule | Element>,
    pattern: ReactionPattern,
    _conditions: { temperature?: number; catalyst?: string; solvent?: string; light?: boolean }
  ): ReactionPrediction['products'] {
    const products: ReactionPrediction['products'] = [];

    for (const productType of pattern.productTypes) {
      products.push({
        formula: this.generateFormulaForType(productType, reactants),
        name: this.generateNameForType(productType),
        probability: pattern.probability,
        mechanism: pattern.mechanism
      });
    }

    return products;
  }

  private generateFormulaForType(type: string, _reactants: Array<Molecule | Element>): string {
    const formulaMap: Record<string, string> = {
      'alkane': 'CnH(2n+2)',
      'alkene': 'CnH(2n)',
      'alkyne': 'CnH(2n-2)',
      'alcohol': 'CnH(2n+1)OH',
      'ester': 'RCOOR\'',
      'water': 'H2O',
      'ketone': 'RCOR\'',
      'alkyl_halide': 'RX',
      'carboxylate_salt': 'RCOO-M+',
      'nitroaromatic': 'ArNO2'
    };

    return formulaMap[type] || 'Product';
  }

  private generateNameForType(type: string): string {
    const nameMap: Record<string, string> = {
      'alkane': 'Saturated Hydrocarbon',
      'alkene': 'Unsaturated Hydrocarbon',
      'alcohol': 'Alcohol',
      'ester': 'Ester',
      'water': 'Water',
      'ketone': 'Ketone',
      'alkyl_halide': 'Alkyl Halide',
      'carboxylate_salt': 'Carboxylate Salt',
      'nitroaromatic': 'Nitroaromatic Compound'
    };

    return nameMap[type] || 'Organic Product';
  }

  private predictGenericReaction(
    reactants: Array<Molecule | Element>,
    conditions: { temperature?: number; catalyst?: string; solvent?: string; light?: boolean }
  ): ReactionPrediction {
    const hasOrganic = reactants.some(r => 'structure_type' in r && r.structure_type === 'organic');
    const hasElement = reactants.some(r => 'symbol' in r);

    if (hasOrganic && hasElement) {
      return {
        products: [{
          formula: 'Complex Product',
          name: 'Substitution or Addition Product',
          probability: 0.6,
          mechanism: 'Generic organic transformation'
        }],
        confidence: 0.6,
        reactionType: 'organic_transformation',
        conditions: {
          temperature: conditions.temperature ?? 298.15
        }
      };
    }

    return {
      products: [{
        formula: 'Unknown',
        name: 'Reaction product uncertain',
        probability: 0.3,
        mechanism: 'Insufficient data for prediction'
      }],
      confidence: 0.3,
      reactionType: 'unknown',
      conditions: {
        temperature: conditions.temperature ?? 298.15
      }
    };
  }

  private classifyReactionType(functionalGroups: string[], elementSymbols: string[]): string {
    if (functionalGroups.includes('alkene') || functionalGroups.includes('alkyne')) {
      return 'addition';
    }

    if (functionalGroups.includes('aromatic')) {
      return 'substitution';
    }

    if (functionalGroups.includes('alcohol') && functionalGroups.includes('carboxylic_acid')) {
      return 'condensation';
    }

    if (elementSymbols.includes('O')) {
      return 'oxidation';
    }

    if (elementSymbols.includes('H')) {
      return 'reduction';
    }

    return 'generic';
  }

  learnFromReaction(
    reactants: Array<Molecule | Element>,
    products: Array<Molecule>,
    conditions: { temperature?: number; catalyst?: string; solvent?: string; light?: boolean },
    success: boolean
  ): void {
    const functionalGroups = this.extractFunctionalGroups(reactants);
    const productTypes = this.extractFunctionalGroups(products);

    if (success && functionalGroups.length > 0 && productTypes.length > 0) {
      const newPattern: ReactionPattern = {
        reactantTypes: functionalGroups,
        productTypes,
        conditions,
        probability: 0.7,
        mechanism: 'Learned from experimental data'
      };

      this.reactionDatabase.push(newPattern);
    }
  }

  suggestOptimalConditions(
    reactants: Array<Molecule | Element>
  ): { temperature: number; catalyst?: string; solvent?: string; light?: boolean } {
    const functionalGroups = this.extractFunctionalGroups(reactants);

    if (functionalGroups.includes('aromatic')) {
      return {
        temperature: 350,
        catalyst: 'Lewis acid (AlCl3 or FeBr3)',
        solvent: 'Non-polar'
      };
    }

    if (functionalGroups.includes('alkene')) {
      return {
        temperature: 298,
        catalyst: 'Acid or metal catalyst',
        solvent: 'Varies by reaction'
      };
    }

    if (functionalGroups.includes('carbonyl')) {
      return {
        temperature: 273,
        solvent: 'Ether or THF'
      };
    }

    return {
      temperature: 298
    };
  }
}

export const mlReactionPredictor = new MLReactionPredictor();