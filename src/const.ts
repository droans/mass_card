export const DEFAULT_CONFIG = {
  expanded: false,
  title: 'Player Queue',
  limit_before: 5,
  limit_after: 100,
  show_album_covers: true,
  show_artist_names: true,
  allow_collapsing: true,
}

export enum ConfigErrors {
  CONFIG_MISSING = 'Invalid configuration.',
  NO_ENTITY = 'You need to define entity.',
  ENTITY_TYPE = 'Entity must be a string!',
  MISSING_ENTITY = 'Entity does not exist!',
  OK = 'ok'
}