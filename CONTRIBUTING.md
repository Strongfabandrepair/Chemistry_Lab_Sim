# Contributing to Quantum Chemistry Laboratory

Thank you for your interest in contributing to the Quantum Chemistry Laboratory project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Detailed steps to reproduce the problem
- Expected behavior vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, Node version)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- A clear description of the feature
- The problem it solves or value it adds
- Any relevant examples or mockups
- Potential implementation approach (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issues when applicable
   ```bash
   git commit -m "Add feature: description of feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of the changes
   - Link to any related issues
   - Include screenshots for UI changes

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/quantum-chemistry-laboratory.git
   cd quantum-chemistry-laboratory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all new files
- Enable strict type checking
- Define proper interfaces and types
- Avoid `any` types when possible

### React
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

### Styling
- Use Tailwind CSS utility classes
- Follow the existing color scheme
- Ensure responsive design
- Test on multiple screen sizes

### File Organization
- Keep files focused and manageable
- Use clear, descriptive file names
- Group related functionality
- Export/import properly

## Chemistry Engine Contributions

When contributing to the chemistry engine:
- Ensure scientific accuracy
- Cite sources for chemical data
- Add appropriate unit tests
- Document assumptions and limitations
- Consider edge cases

## Database Changes

If your contribution requires database changes:
- Create a new migration file
- Follow the existing migration format
- Include detailed comments
- Test with sample data
- Update RLS policies as needed

## Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Include usage examples
- Keep documentation current

## Testing

Before submitting a PR:
- [ ] Code passes TypeScript checks
- [ ] Code passes ESLint
- [ ] Application builds successfully
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Responsive design verified

## Questions?

If you have questions or need help:
- Check existing issues and discussions
- Create a new issue with the "question" label
- Join our community discussions

## Recognition

All contributors will be recognized in the project. Thank you for helping make chemistry education more accessible and engaging!
