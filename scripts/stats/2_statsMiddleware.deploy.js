// 2. Deploy StatsMiddleware contract.
// npx hardhat run scripts/stats/2_statsMiddleware.deploy.js --network superposition

const contractName = "StatsMiddleware";

const statsAddress = "0x5eA5B4665FE9a96b8ded4ec99676235FC137A763";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(statsAddress);
  await instance.deployed();

  console.log(contractName + " contract address:", instance.address);
  
  // create a Stats contract instance
  const statsInstance = await ethers.getContractAt("Stats", statsAddress);

  // set middleware address (setStatsWriterAddress)
  console.log("Setting middleware address...");
  const tx2 = await statsInstance.setStatsWriterAddress(instance.address);
  await tx2.wait();

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + statsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });