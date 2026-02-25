import * as migration_20260225_141558 from './20260225_141558';
import * as migration_20260225_164022 from './20260225_164022';

export const migrations = [
  {
    up: migration_20260225_141558.up,
    down: migration_20260225_141558.down,
    name: '20260225_141558'
  },
  {
    up: migration_20260225_164022.up,
    down: migration_20260225_164022.down,
    name: '20260225_164022'
  },
];
