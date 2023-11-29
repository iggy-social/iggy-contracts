// TODO:
// 1. Create the first NFT collection through the factory.
// 2. Verify the contract on block explorer using this script (run the command below).
// Run: npx hardhat run scripts/launchpad/erc721/5_verifyNftContract.js --network arbitrumOne

const networkName = "arbitrumOne";
const contractAddress = "0x4D27d48e1218528972B6110e837CB3323af7cb7B";

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