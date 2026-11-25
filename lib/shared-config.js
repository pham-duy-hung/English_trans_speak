/**
 * Default Azure credentials for packaged builds shared with friends.
 * Keep EMPTY on GitHub. When packing for friends, pack.ps1 injects your key.
 */
export const SHARED_AZURE = {
  key: '',
  region: 'eastasia',
};
