module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./src/test-setup.ts'],
  moduleNameMapper: {
    '@zeste/shared': '<rootDir>/../../packages/shared/src',
    '@zeste/domain': '<rootDir>/../../packages/domain/src',
  },
};
