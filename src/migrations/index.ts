import * as migration_20260219_182350_initial from './20260219_182350_initial';
import * as migration_20260219_204024_add_meeting_with from './20260219_204024_add_meeting_with';
import * as migration_20260224_215814 from './20260224_215814';
import * as migration_20260225_134305 from './20260225_134305';

export const migrations = [
  {
    up: migration_20260219_182350_initial.up,
    down: migration_20260219_182350_initial.down,
    name: '20260219_182350_initial',
  },
  {
    up: migration_20260219_204024_add_meeting_with.up,
    down: migration_20260219_204024_add_meeting_with.down,
    name: '20260219_204024_add_meeting_with',
  },
  {
    up: migration_20260224_215814.up,
    down: migration_20260224_215814.down,
    name: '20260224_215814',
  },
  {
    up: migration_20260225_134305.up,
    down: migration_20260225_134305.down,
    name: '20260225_134305'
  },
];
