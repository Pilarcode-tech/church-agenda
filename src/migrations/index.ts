import * as migration_20260225_141558 from './20260225_141558';
import * as migration_20260225_164022 from './20260225_164022';
import * as migration_20260225_165500 from './20260225_165500';

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
  {
    up: migration_20260225_165500.up,
    down: migration_20260225_165500.down,
    name: '20260225_165500'
  },
];
