// Run: node scripts/nft/early-stakers/generateClaimersJson.js
const fs = require('fs');

// Path to the CSV file
const csvFilePath = 'scripts/nft/early-stakers/addresses.csv'; // @TODO: Change the path

// Read the CSV file
fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the CSV file:', err);
    return;
  }

  // Split the data by newline to get individual addresses
  const addresses = data.trim().split('\n');

  // Array to store claimers
  const claimers = [];

  // Process each address
  addresses.forEach((address) => {
    const trimmedAddress = address.trim();

    // Validate ETH address format
    if (/^(0x)?[0-9a-fA-F]{40}$/.test(trimmedAddress)) {
      // Append the address to the claimers array
      claimers.push([trimmedAddress, 1]);
    } else {
      console.log(`Invalid ETH address: ${trimmedAddress}`);
    }
  });

  // Create the JSON object
  const jsonData = {
    claimers: claimers,
  };

  // Write the JSON object to a file
  fs.writeFile(
    'scripts/nft/early-stakers/claimers.json', // @TODO: Change the path
    JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
        return;
      }
      console.log('JSON file created successfully!');
    }
  );
});
