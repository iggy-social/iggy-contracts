// TODO:
// 1. Create the first NFT collection through the factory.
// 2. Verify the contract on block explorer using this script (run the command below).
// Run: npx hardhat run scripts/launchpad/erc721/5_verifyNftContract.js --network opera

const networkName = "opera";
const contractAddress = "0xb262977D1313da790380E10a232111b74B0C1d57";

async function main() {
  console.log("Copy the line below and paste it in your terminal to verify the TLD contract on Etherscan:");
  console.log("");
  console.log("npx hardhat verify --network " + networkName + " --constructor-args scripts/launchpad/erc721/5_arguments.js " + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });