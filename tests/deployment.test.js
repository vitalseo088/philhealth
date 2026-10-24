const assert = require('node:assert/strict');
const test = require('node:test');
const lockfile = require('../package-lock.json');

test('Cloudflare build lockfile uses npm packages reachable outside Replit', () => {
  const privateRegistryPackages = Object.entries(lockfile.packages)
    .filter(([, pkg]) => pkg.resolved && !pkg.resolved.startsWith('https://registry.npmjs.org/'))
    .map(([name, pkg]) => `${name}: ${pkg.resolved}`);

  assert.deepEqual(privateRegistryPackages, []);
});
