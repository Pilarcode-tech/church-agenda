import * as migration_20260219_182350_initial from './20260219_182350_initial';
import * as migration_20260219_204024_add_meeting_with from './20260219_204024_add_meeting_with';

export const migrations = [
  {
    up: migration_20260219_182350_initial.up,
    down: migration_20260219_182350_initial.down,
    name: '20260219_182350_initial',
  },
  {
    up: migration_20260219_204024_add_meeting_with.up,
    down: migration_20260219_204024_add_meeting_with.down,
    name: '20260219_204024_add_meeting_with'
  },
];
