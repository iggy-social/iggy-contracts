// npx hardhat run scripts/activity-points/activityPointsAlt.deploy.js --network sepolia

const contractName = "ActivityPointsAlt";

const statsAddress = "0x2D4144B4E00cf1dC1c4DeDa37cb1CaCEda030998"; // stats contract
const mintedPostsStatsAddress = "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e";
const tldAddress = "0x1DD820F4f48eBC2B8e7F666F34fbC5820808074e";
const multiplier = 1_000_000; // 1 eth = 1M points

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    statsAddress,
    mintedPostsStatsAddress,
    tldAddress,
    multiplier
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + statsAddress + " " + mintedPostsStatsAddress + " " + tldAddress + ' "' + multiplier + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });