// TODO:
// 1. Create the first NFT collection through the factory.
// 2. Verify the contract on block explorer using this script (run the command below).
// Run: npx hardhat run scripts/distributor/other/verifyDistributor.js --network scroll

const contractAddress = "0x0E66249733DDFe422F7A127B0b9E906601F23E06";

async function main() {
  console.log("Copy the line below and paste it in your terminal to verify the TLD contract on Etherscan:");
  console.log("");
  console.log("npx hardhat verify --network " + network.name + " " + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });