import * as migration_20260219_182350_initial from './20260219_182350_initial';

export const migrations = [
  {
    up: migration_20260219_182350_initial.up,
    down: migration_20260219_182350_initial.down,
    name: '20260219_182350_initial'
  },
];
