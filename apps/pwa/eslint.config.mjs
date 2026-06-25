import reactLibraryPreset from '@lilog/eslint-config/react-library';

export default [
  {
    ignores: ['dist/**', 'src/routeTree.gen.ts', 'scripts/**'],
  },
  ...reactLibraryPreset,
];
