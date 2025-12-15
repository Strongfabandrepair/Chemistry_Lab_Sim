/*
  # Populate Molecular Database

  1. Molecules
    - Common organic molecules (methane, ethanol, benzene, etc.)
    - Important inorganic molecules
    - Functional group examples

  2. Molecular Orbitals
    - HOMO/LUMO data for select molecules

  3. Spectroscopy Data
    - UV-Vis, IR, NMR peaks for common molecules

  4. Tutorials
    - Beginner through advanced chemistry tutorials
*/

INSERT INTO molecules (name, iupac_name, formula, smiles, molecular_weight, structure_type, geometry, functional_groups, properties) VALUES
('Water', 'Oxidane', 'H2O', 'O', 18.015, 'inorganic', 'bent', ARRAY['hydroxyl'], '{"boiling_point": 373.15, "melting_point": 273.15, "polarity": "polar", "soluble_in_water": true, "ph": 7.0}'::jsonb),
('Methane', 'Methane', 'CH4', 'C', 16.043, 'organic', 'tetrahedral', ARRAY['alkane'], '{"boiling_point": 111.66, "melting_point": 90.69, "polarity": "nonpolar", "soluble_in_water": false}'::jsonb),
('Ethanol', 'Ethanol', 'C2H6O', 'CCO', 46.069, 'organic', 'tetrahedral', ARRAY['alcohol','hydroxyl'], '{"boiling_point": 351.45, "melting_point": 159.05, "polarity": "polar", "soluble_in_water": true, "pka": 15.9}'::jsonb),
('Acetic Acid', 'Ethanoic acid', 'C2H4O2', 'CC(=O)O', 60.052, 'organic', 'trigonal_planar', ARRAY['carboxylic_acid','carbonyl'], '{"boiling_point": 391.15, "melting_point": 289.75, "polarity": "polar", "soluble_in_water": true, "pka": 4.76}'::jsonb),
('Benzene', 'Benzene', 'C6H6', 'c1ccccc1', 78.114, 'organic', 'planar', ARRAY['aromatic'], '{"boiling_point": 353.25, "melting_point": 278.65, "polarity": "nonpolar", "soluble_in_water": false, "resonance": true}'::jsonb),
('Acetone', 'Propan-2-one', 'C3H6O', 'CC(=O)C', 58.080, 'organic', 'trigonal_planar', ARRAY['ketone','carbonyl'], '{"boiling_point": 329.15, "melting_point": 178.45, "polarity": "polar", "soluble_in_water": true}'::jsonb),
('Glucose', 'D-Glucose', 'C6H12O6', 'C(C1C(C(C(C(O1)O)O)O)O)O', 180.156, 'organic', 'chair', ARRAY['aldehyde','polyol','hydroxyl'], '{"boiling_point": 623.15, "melting_point": 419.15, "polarity": "polar", "soluble_in_water": true, "sweetness": true}'::jsonb),
('Ammonia', 'Azane', 'NH3', 'N', 17.031, 'inorganic', 'trigonal_pyramidal', ARRAY['amine'], '{"boiling_point": 239.81, "melting_point": 195.42, "polarity": "polar", "soluble_in_water": true, "basic": true}'::jsonb),
('Carbon Dioxide', 'Carbon dioxide', 'CO2', 'C(=O)=O', 44.010, 'inorganic', 'linear', ARRAY['oxide'], '{"boiling_point": 194.65, "melting_point": 216.58, "polarity": "nonpolar", "soluble_in_water": true, "acidic": true}'::jsonb),
('Ethylene', 'Ethene', 'C2H4', 'C=C', 28.054, 'organic', 'planar', ARRAY['alkene','double_bond'], '{"boiling_point": 169.42, "melting_point": 103.99, "polarity": "nonpolar", "soluble_in_water": false}'::jsonb),
('Formaldehyde', 'Methanal', 'CH2O', 'C=O', 30.026, 'organic', 'trigonal_planar', ARRAY['aldehyde','carbonyl'], '{"boiling_point": 254.05, "melting_point": 181.15, "polarity": "polar", "soluble_in_water": true}'::jsonb),
('Methanol', 'Methanol', 'CH4O', 'CO', 32.042, 'organic', 'tetrahedral', ARRAY['alcohol','hydroxyl'], '{"boiling_point": 337.85, "melting_point": 175.49, "polarity": "polar", "soluble_in_water": true}'::jsonb),
('Ethyl Acetate', 'Ethyl ethanoate', 'C4H8O2', 'CCOC(=O)C', 88.106, 'organic', 'tetrahedral', ARRAY['ester','carbonyl'], '{"boiling_point": 350.15, "melting_point": 189.55, "polarity": "polar", "soluble_in_water": true}'::jsonb),
('Acetylene', 'Ethyne', 'C2H2', 'C#C', 26.038, 'organic', 'linear', ARRAY['alkyne','triple_bond'], '{"boiling_point": 189.15, "melting_point": 192.4, "polarity": "nonpolar", "soluble_in_water": false}'::jsonb),
('Phenol', 'Phenol', 'C6H6O', 'Oc1ccccc1', 94.113, 'organic', 'planar', ARRAY['aromatic','alcohol','hydroxyl'], '{"boiling_point": 454.99, "melting_point": 313.95, "polarity": "polar", "soluble_in_water": true, "pka": 9.95}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO spectroscopy_data (molecule_id, spectrum_type, peaks, conditions) 
SELECT 
  m.id,
  'uv_vis',
  CASE m.name
    WHEN 'Benzene' THEN '[{"wavelength": 254, "intensity": 0.9, "transition": "π→π*"}]'::jsonb
    WHEN 'Acetone' THEN '[{"wavelength": 280, "intensity": 0.7, "transition": "n→π*"}]'::jsonb
    WHEN 'Ethylene' THEN '[{"wavelength": 171, "intensity": 0.8, "transition": "π→π*"}]'::jsonb
    ELSE '[]'::jsonb
  END,
  '{"solvent": "hexane", "temperature": 298.15}'::jsonb
FROM molecules m
WHERE m.name IN ('Benzene', 'Acetone', 'Ethylene');

INSERT INTO spectroscopy_data (molecule_id, spectrum_type, peaks, conditions)
SELECT
  m.id,
  'ir',
  CASE m.name
    WHEN 'Water' THEN '[{"wavenumber": 3657, "intensity": "strong", "bond": "O-H stretch"}, {"wavenumber": 1595, "intensity": "medium", "bond": "H-O-H bend"}]'::jsonb
    WHEN 'Methane' THEN '[{"wavenumber": 2917, "intensity": "strong", "bond": "C-H stretch"}, {"wavenumber": 1306, "intensity": "medium", "bond": "C-H bend"}]'::jsonb
    WHEN 'Ethanol' THEN '[{"wavenumber": 3350, "intensity": "broad", "bond": "O-H stretch"}, {"wavenumber": 2980, "intensity": "strong", "bond": "C-H stretch"}, {"wavenumber": 1050, "intensity": "strong", "bond": "C-O stretch"}]'::jsonb
    WHEN 'Acetone' THEN '[{"wavenumber": 1715, "intensity": "very strong", "bond": "C=O stretch"}, {"wavenumber": 2975, "intensity": "strong", "bond": "C-H stretch"}]'::jsonb
    WHEN 'Acetic Acid' THEN '[{"wavenumber": 3000, "intensity": "very broad", "bond": "O-H stretch"}, {"wavenumber": 1710, "intensity": "very strong", "bond": "C=O stretch"}]'::jsonb
    ELSE '[]'::jsonb
  END,
  '{"method": "transmission", "phase": "gas"}'::jsonb
FROM molecules m
WHERE m.name IN ('Water', 'Methane', 'Ethanol', 'Acetone', 'Acetic Acid');

INSERT INTO spectroscopy_data (molecule_id, spectrum_type, peaks, conditions)
SELECT
  m.id,
  'nmr',
  CASE m.name
    WHEN 'Ethanol' THEN '[{"chemical_shift": 1.2, "integration": 3, "multiplicity": "triplet", "assignment": "CH3"}, {"chemical_shift": 3.7, "integration": 2, "multiplicity": "quartet", "assignment": "CH2"}, {"chemical_shift": 5.4, "integration": 1, "multiplicity": "singlet", "assignment": "OH"}]'::jsonb
    WHEN 'Acetone' THEN '[{"chemical_shift": 2.1, "integration": 6, "multiplicity": "singlet", "assignment": "CH3"}]'::jsonb
    WHEN 'Benzene' THEN '[{"chemical_shift": 7.3, "integration": 6, "multiplicity": "singlet", "assignment": "aromatic CH"}]'::jsonb
    ELSE '[]'::jsonb
  END,
  '{"nucleus": "1H", "frequency": 400, "solvent": "CDCl3", "temperature": 298.15}'::jsonb
FROM molecules m
WHERE m.name IN ('Ethanol', 'Acetone', 'Benzene');

INSERT INTO molecular_orbitals (molecule_id, orbital_type, energy_level, orbital_name, electron_count)
SELECT
  m.id,
  'bonding',
  -10.5,
  'HOMO',
  2
FROM molecules m WHERE m.name = 'Water';

INSERT INTO molecular_orbitals (molecule_id, orbital_type, energy_level, orbital_name, electron_count)
SELECT
  m.id,
  'antibonding',
  2.3,
  'LUMO',
  0
FROM molecules m WHERE m.name = 'Water';

INSERT INTO molecular_orbitals (molecule_id, orbital_type, energy_level, orbital_name, electron_count)
SELECT
  m.id,
  'bonding',
  -9.2,
  'HOMO',
  2
FROM molecules m WHERE m.name = 'Benzene';

INSERT INTO molecular_orbitals (molecule_id, orbital_type, energy_level, orbital_name, electron_count)
SELECT
  m.id,
  'antibonding',
  1.5,
  'LUMO',
  0
FROM molecules m WHERE m.name = 'Benzene';

INSERT INTO tutorials (title, description, difficulty_level, category, steps, objectives, prerequisites, estimated_time, order_index) VALUES
('Introduction to Chemical Reactions', 'Learn the basics of chemical reactions and how to predict products', 'beginner', 'general', 
'[
  {"step": 1, "title": "Understanding Elements", "content": "Click on elements in the periodic table to select them. Each element has unique properties.", "action": "select_elements"},
  {"step": 2, "title": "Combining Elements", "content": "Select Sodium (Na) and Chlorine (Cl) from the periodic table.", "action": "wait_for_selection"},
  {"step": 3, "title": "Setting Conditions", "content": "Adjust the temperature to 400K to provide activation energy.", "action": "set_temperature"},
  {"step": 4, "title": "Run Simulation", "content": "Click Run Simulation to see the reaction occur and observe the formation of NaCl.", "action": "run_simulation"}
]'::jsonb,
ARRAY['Understand what a chemical reaction is', 'Learn to predict simple ionic compounds', 'Observe energy changes in reactions'],
ARRAY[]::text[],
15,
1),

('Exploring Molecular Structure', 'Visualize 3D molecular structures and understand geometry', 'beginner', 'general',
'[
  {"step": 1, "title": "3D Visualization", "content": "Observe how atoms arrange in 3D space. The visualization shows particles moving based on temperature.", "action": "observe"},
  {"step": 2, "title": "Molecular Geometry", "content": "Create water (H2O) by selecting hydrogen and oxygen. Notice the bent geometry.", "action": "create_water"},
  {"step": 3, "title": "Understanding Bonds", "content": "Watch how atoms form bonds. The blue lines show bonding interactions.", "action": "observe_bonds"},
  {"step": 4, "title": "Temperature Effects", "content": "Increase temperature and see how particle motion increases.", "action": "temperature_experiment"}
]'::jsonb,
ARRAY['Understand 3D molecular structures', 'Recognize different geometries', 'See how temperature affects molecular motion'],
ARRAY[]::text[],
20,
2),

('Organic Chemistry Basics', 'Introduction to organic molecules and functional groups', 'intermediate', 'organic',
'[
  {"step": 1, "title": "Carbon Chemistry", "content": "Carbon forms the basis of organic chemistry with its ability to form 4 bonds.", "action": "learn"},
  {"step": 2, "title": "Functional Groups", "content": "Learn about common functional groups: alcohols, aldehydes, ketones, and carboxylic acids.", "action": "explore_groups"},
  {"step": 3, "title": "Building Molecules", "content": "Construct simple organic molecules like methanol and ethanol.", "action": "build_molecules"},
  {"step": 4, "title": "Properties", "content": "Observe how functional groups affect physical properties like boiling point and solubility.", "action": "compare_properties"}
]'::jsonb,
ARRAY['Understand carbon bonding', 'Identify functional groups', 'Predict organic molecule properties'],
ARRAY['Introduction to Chemical Reactions']::text[],
25,
3),

('Spectroscopy Fundamentals', 'Learn how to interpret UV-Vis, IR, and NMR spectra', 'intermediate', 'analytical',
'[
  {"step": 1, "title": "Introduction to Spectroscopy", "content": "Spectroscopy reveals molecular structure by analyzing how molecules interact with light.", "action": "learn"},
  {"step": 2, "title": "IR Spectroscopy", "content": "IR spectra show characteristic peaks for different bonds. C=O appears around 1700 cm⁻¹.", "action": "analyze_ir"},
  {"step": 3, "title": "UV-Vis Spectroscopy", "content": "UV-Vis shows electronic transitions. Aromatic compounds absorb around 250-280 nm.", "action": "analyze_uv"},
  {"step": 4, "title": "NMR Spectroscopy", "content": "NMR reveals the hydrogen environment. Chemical shift, integration, and splitting patterns tell the structure.", "action": "analyze_nmr"}
]'::jsonb,
ARRAY['Interpret IR spectra', 'Understand UV-Vis absorption', 'Read NMR spectra'],
ARRAY['Exploring Molecular Structure']::text[],
30,
4),

('Quantum Mechanics in Chemistry', 'Understanding electron orbitals and quantum behavior', 'advanced', 'physical',
'[
  {"step": 1, "title": "Wave-Particle Duality", "content": "Electrons behave as both waves and particles. This explains atomic structure.", "action": "learn"},
  {"step": 2, "title": "Atomic Orbitals", "content": "Electrons occupy orbitals (s, p, d, f) with specific shapes and energies.", "action": "visualize_orbitals"},
  {"step": 3, "title": "Molecular Orbitals", "content": "When atoms bond, atomic orbitals combine to form molecular orbitals (HOMO and LUMO).", "action": "explore_mo"},
  {"step": 4, "title": "Electronic Transitions", "content": "Light absorption promotes electrons from HOMO to LUMO, giving molecules color.", "action": "simulate_transitions"}
]'::jsonb,
ARRAY['Understand quantum mechanics basics', 'Visualize molecular orbitals', 'Explain electronic transitions'],
ARRAY['Spectroscopy Fundamentals']::text[],
40,
5),

('pH and Acid-Base Chemistry', 'Master acids, bases, and pH calculations', 'intermediate', 'general',
'[
  {"step": 1, "title": "What is pH?", "content": "pH measures acidity from 0-14. pH 7 is neutral, <7 is acidic, >7 is basic.", "action": "learn"},
  {"step": 2, "title": "Strong Acids", "content": "Create hydrochloric acid (HCl) and observe complete dissociation.", "action": "create_hcl"},
  {"step": 3, "title": "Weak Acids", "content": "Create acetic acid and see partial dissociation. pKa determines acid strength.", "action": "create_acetic"},
  {"step": 4, "title": "Titration", "content": "Neutralize an acid with a base and observe the pH change.", "action": "perform_titration"}
]'::jsonb,
ARRAY['Calculate pH values', 'Understand strong vs weak acids', 'Perform virtual titrations'],
ARRAY['Introduction to Chemical Reactions']::text[],
25,
6)
ON CONFLICT DO NOTHING;