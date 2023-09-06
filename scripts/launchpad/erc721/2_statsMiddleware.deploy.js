// 2. Deploy StatsMiddleware contract.
// npx hardhat run scripts/launchpad/erc721/2_statsMiddleware.deploy.js --network songbird

const contractName = "StatsMiddleware";

const launchpadStatsAddress = "0xb4C5aDc49CE8Cf15218442564DDa489f87a180f6";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy();
  await instance.deployed();

  console.log(contractName + " contract address:", instance.address);

  // set launchpad stats address (setStatsAddress)
  console.log("Setting launchpad stats address...");
  await instance.setStatsAddress(launchpadStatsAddress);
  
  // create a LaunchpadStats contract instance
  const launchpadStats = await ethers.getContractAt("LaunchpadStats", launchpadStatsAddress);

  // set middleware address (setStatsWriterAddress)
  console.log("Setting middleware address...");
  await launchpadStats.setStatsWriterAddress(instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });