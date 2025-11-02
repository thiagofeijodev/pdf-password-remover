import path from 'path';
import fs from 'fs';

const swcrc = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), '.swcrc'), { encoding: 'utf-8' }),
);

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { ...swcrc }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '\\.s?css$': '<rootDir>/.config/tests/fileMock.js',
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/.config/tests/fileMock.js',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx,js,jsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/.config/tests/setupTests.js', '@testing-library/jest-dom'],
};

export default config;
