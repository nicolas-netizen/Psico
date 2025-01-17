require('esbuild').buildSync({
  entryPoints: ['src/scripts/initFirestore.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/init-db.js',
});

require('./dist/init-db.js');
