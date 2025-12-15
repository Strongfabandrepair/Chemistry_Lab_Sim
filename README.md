# Quantum Chemistry Laboratory

An interactive, research-grade chemistry simulator built with React, TypeScript, and Supabase. This application provides a comprehensive molecular visualization platform where users can experiment with chemical reactions, explore the complete periodic table, and observe stunning real-time visual effects.

![Chemistry Lab Simulator](https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1200)

## Features

### Interactive Periodic Table
- Complete periodic table of all 118 elements
- Detailed information for each element including:
  - Atomic mass, electron configuration, electronegativity
  - Ionization energy, electron affinity, atomic radius
  - Physical properties (melting/boiling points, density, thermal conductivity)
  - Oxidation states, crystal structure, magnetic properties
  - Color coding by element type and state

### Advanced Chemistry Engine
- Precise molecular mass calculations
- Bond type prediction (ionic, covalent, metallic)
- Thermodynamic calculations:
  - Enthalpy changes using Hess's Law
  - Entropy calculations
  - Gibbs free energy predictions
  - Temperature and phase change modeling
- Comprehensive reaction detection:
  - Metal oxidation reactions
  - Combustion reactions
  - Acid-base reactions
  - Synthesis reactions
  - Decomposition reactions

### Real-Time Molecular Visualization
- Custom-built 3D particle visualization engine
- Dynamic visual effects:
  - Explosion effects with radiating energy waves
  - Heat shimmer and thermal distortion
  - Gas evolution with bubble physics
  - Light emission and bioluminescence
  - Color change transitions
  - Precipitation and crystallization
  - Molecular agitation and stirring effects
- Realistic physics-based animations
- Alpha-blended particle systems with gradient rendering

### Recipe System
- Pre-configured chemical reactions
- Save and load custom experiments
- Share reaction parameters
- Built-in recipes for common reactions:
  - Water formation (H₂ + O₂)
  - Rust formation (Fe + O₂)
  - Ammonia synthesis (N₂ + H₂)
  - Sodium chloride formation (Na + Cl₂)

### Parameter Controls
- Temperature control (0-5000 K)
- Pressure adjustment (0.1-100 atm)
- Volume control (0.1-100 L)
- Atmosphere selection (air, nitrogen, argon, vacuum)
- Unit conversions:
  - Temperature: Kelvin, Celsius, Fahrenheit
  - Pressure: atm, bar, psi, Pa, mmHg, torr
  - Volume: L, mL, gal, m³
  - Mass: g, kg, lb, oz

### Database Integration
- PostgreSQL database via Supabase
- Complete periodic table data storage
- Experiment persistence
- Recipe sharing and storage
- Row-level security for user data

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Canvas Rendering**: HTML5 Canvas API
- **State Management**: React Hooks

## Project Structure

```
quantum-chemistry-laboratory/
├── src/
│   ├── components/
│   │   ├── Laboratory.tsx          # Main application container
│   │   ├── PeriodicTable.tsx       # Interactive periodic table component
│   │   ├── VisualizationCanvas.tsx # Canvas rendering component
│   │   ├── ParameterControls.tsx   # Environmental controls panel
│   │   └── RecipesBook.tsx         # Recipe management interface
│   ├── lib/
│   │   ├── chemistryEngine.ts      # Core chemistry calculations
│   │   ├── visualizationEngine.ts  # Particle system and effects
│   │   ├── elementColors.ts        # Element color mappings
│   │   ├── unitConversions.ts      # Unit conversion utilities
│   │   └── supabase.ts             # Database client and types
│   ├── App.tsx                     # Application entry point
│   ├── main.tsx                    # React DOM rendering
│   └── index.css                   # Global styles
├── supabase/
│   └── migrations/
│       ├── 20251215025442_create_chemistry_lab_schema.sql
│       ├── 20251215025732_populate_periodic_table.sql
│       ├── 20251215032715_add_known_recipes.sql
│       └── 20251215034724_fix_rls_public_access.sql
├── public/                         # Static assets
├── package.json                    # Project dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── README.md                       # This file
```

## Database Schema

### Elements Table
Stores complete periodic table data with comprehensive physical and chemical properties for all 118 elements.

**Key Columns:**
- Basic properties: id, symbol, name, atomic_mass
- Electronic properties: electron_config, electronegativity, ionization_energy, electron_affinity
- Physical properties: melting_point, boiling_point, density, specific_heat, thermal_conductivity
- Chemical properties: oxidation_states, crystal_structure, magnetic_properties
- Classification: group_block, period, group_number, is_radioactive

### Compounds Table
Database of known chemical compounds with thermodynamic properties.

**Key Columns:**
- formula, name, molecular_mass
- structure (JSONB), melting_point, boiling_point, density
- Thermodynamic data: enthalpy_formation, entropy, gibbs_energy
- solubility (JSONB), color, hazards (JSONB)

### Reactions Table
Known chemical reactions with kinetic and thermodynamic data.

**Key Columns:**
- reaction_type, reactants (JSONB), products (JSONB)
- conditions (JSONB)
- Thermodynamic: enthalpy_change, entropy_change, activation_energy
- Kinetic: rate_constant, equilibrium_constant, is_reversible

### Experiments Table
User-created simulations and experimental results.

**Key Columns:**
- user_id, title, description
- Environmental: temperature, pressure, volume, atmosphere
- results (JSONB), visual_state (JSONB)

### Mixture Components Table
Tracks individual components added to experiments.

**Key Columns:**
- experiment_id, element_id, compound_id
- mass, moles, sequence

## Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Setup

1. Clone the repository:
```bash
git clone https://github.com/strongfabandrepair/quantum-chemistry-laboratory.git
cd quantum-chemistry-laboratory
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Create a new Supabase project
   - Run the migrations in order from `supabase/migrations/`
   - The migrations will:
     - Create the schema (elements, compounds, reactions, experiments, mixture_components)
     - Populate the periodic table with all 118 elements
     - Add known recipes
     - Configure row-level security policies

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Creating a Chemical Reaction

1. **Select Elements**: Click on elements in the periodic table to add them to your mixture
2. **Adjust Mass**: Use the mass slider to control how much of each element to add
3. **Set Environmental Conditions**:
   - Temperature (affects reaction rates and phases)
   - Pressure (affects gas behavior)
   - Volume (affects concentration)
   - Atmosphere (air, nitrogen, argon, or vacuum)
4. **React**: Click the "React" button to simulate the chemical reaction
5. **Observe**: Watch the visualization canvas for dramatic visual effects

### Using Recipes

1. Click the "Recipes" button to open the recipe book
2. Select a pre-configured reaction (e.g., Water Formation, Rust Formation)
3. The system automatically loads the correct elements and parameters
4. Click "React" to see the reaction

### Saving Experiments

Experiments are automatically saved to your Supabase database, allowing you to:
- Resume experiments later
- Share recipes with other users
- Track your experimental history

## Chemistry Engine Details

### Reaction Detection

The chemistry engine analyzes element combinations and environmental conditions to detect:

1. **Metal Oxidation**: Detects when metals react with oxygen
   - Calculates oxide formation (MxOy)
   - Predicts color based on metal type
   - Generates heat and light effects

2. **Combustion**: Identifies fuel + oxygen reactions
   - Models explosive energy release
   - Produces CO₂ and H₂O
   - Dramatic visual effects

3. **Synthesis**: Combines elements into compounds
   - Uses electronegativity to predict bonding
   - Calculates bond strengths
   - Determines molecular formulas

4. **Acid-Base**: Detects proton transfer reactions
   - Identifies pH changes
   - Predicts salt formation
   - Models neutralization energy

### Thermodynamic Calculations

- **Enthalpy**: Calculated using standard formation enthalpies
- **Entropy**: Determined from statistical mechanics
- **Gibbs Free Energy**: ΔG = ΔH - TΔS (predicts spontaneity)
- **Temperature Changes**: Based on heat capacity and energy transfer

### Visual Effects System

The visualization engine uses a particle-based system with:
- Time-based progress tracking
- Alpha blending for smooth transitions
- Multi-layer rendering for complex effects
- Physics-based motion (gravity, turbulence, diffusion)

## Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Type check without emitting files
```

### Code Style

- TypeScript strict mode enabled
- ESLint with React and TypeScript plugins
- Tailwind CSS for styling
- React functional components with hooks
- Modular architecture with clear separation of concerns

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Periodic table data compiled from NIST and other scientific sources
- Chemical reaction patterns based on established chemistry principles
- Visual effects inspired by real laboratory observations
- Built with modern web technologies for optimal performance

## Roadmap

Future enhancements planned:
- [ ] 3D molecular structure visualization
- [ ] Advanced spectroscopy simulations
- [ ] Quantum mechanical calculations
- [ ] Multi-user collaborative experiments
- [ ] VR/AR visualization modes
- [ ] Machine learning for reaction prediction
- [ ] Expanded compound database
- [ ] pH and electrochemistry simulations
- [ ] Organic chemistry support
- [ ] Educational mode with tutorials

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email@example.com]
- Documentation: [link to docs]

---

Built with React, TypeScript, and Supabase | A research-grade chemistry simulator for education and exploration
