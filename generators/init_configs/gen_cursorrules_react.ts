import path from "path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_cursorrules_react = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const dir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = ".cursorrules";
  const content = `# React/TypeScript Frontend Rules

## Project Type
React/TypeScript frontend application with Vite build tool.

## Structure
- \`src/\` - Source code
- \`src/components/\` - React components
- \`src/store/\` - Redux store and state management
- \`src/utils/\` - Utility functions
- \`src/assets/\` - Static assets (images, icons)
- \`public/\` - Public assets
- \`package.json\` - Dependencies and scripts

## Guidelines
- Use functional components with hooks
- Prefer TypeScript strict mode
- Use Redux Toolkit for state management
- Keep components small and focused
- Use proper TypeScript types and interfaces
- Follow React best practices for performance

## Code Style
- Use functional components over class components
- Use \`const\` for component declarations
- Prefer arrow functions for event handlers
- Use proper TypeScript interfaces for props
- Follow camelCase naming conventions

## Component Patterns
- Use \`React.FC\` or explicit return types
- Use \`useState\` for local state
- Use \`useEffect\` for side effects
- Use \`useSelector\` and \`useDispatch\` for Redux
- Extract custom hooks for reusable logic

## Testing
- Use Jest for unit testing
- Use React Testing Library for component testing
- Test user interactions, not implementation details
- Mock external dependencies and API calls
- Use \`npm test\` to run tests

## Build & Development
- Use \`npm run dev\` for development server
- Use \`npm run build\` for production build
- Use \`npm run preview\` to preview production build
- Configure Vite for optimal development experience`;

  return generateFile({ filename, dir, content }, "gen_cursorrules_react");
};

export { gen_cursorrules_react };
