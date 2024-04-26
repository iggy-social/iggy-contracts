// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network base

const contractName = "ActivityPoints";

const statsAddress = "0x682912D4FFF641aaC086C39Cdc1a19730da9d4a1"; // stats contract
const mintedPostsStatsAddress = "0xCFdA326290cFc0E4C9a12278fe42eFB9f840ce49";
const tldStatsAddress = "0x236c817DEDda4E05649B850817fF1881Bb7E8041";
const multiplier = 1_000_000; // points for 1 ETH

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    statsAddress,
    mintedPostsStatsAddress,
    tldStatsAddress,
    multiplier
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + statsAddress + " " + mintedPostsStatsAddress + " " + tldStatsAddress + ' "' + multiplier + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });