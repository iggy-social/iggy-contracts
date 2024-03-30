// TODO:
// 1. Create the first NFT collection through the factory.
// 2. Verify the contract on block explorer using this script (run the command below).
// Run: npx hardhat run scripts/launchpad/erc721/4_verifyNftContract.js --network degen

const contractAddress = "0x2f7f910D746080B4ba14e44462a7b3bFeD8C47B9";

async function main() {
  console.log("Copy the line below and paste it in your terminal to verify the TLD contract on Etherscan:");
  console.log("");
  console.log("npx hardhat verify --network " + network.name + " --constructor-args scripts/launchpad/erc721/4_arguments.js " + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });