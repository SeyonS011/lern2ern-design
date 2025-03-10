
const fs = require('fs');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream('edutrack-project.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully!');
  console.log('Total bytes: ' + archive.pointer());
  console.log('The file edutrack-project.zip has been created.');
});

// Handle archive warnings
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Handle archive errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
archive.file('.env', { name: '.env' });
archive.file('EduTrack.sol', { name: 'EduTrack.sol' });
archive.file('deploy_contract.js', { name: 'deploy_contract.js' });
archive.file('generate-wallet.js', { name: 'generate-wallet.js' });
archive.file('index.html', { name: 'index.html' });
archive.file('index.js', { name: 'index.js' });
archive.file('package.json', { name: 'package.json' });
archive.file('server.js', { name: 'server.js' });
// Exclude node_modules directory as it's large and can be reinstalled

// Finalize the archive
archive.finalize();
