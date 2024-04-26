// npx hardhat run scripts/activity-points/activityPointsAlt.deploy.js --network scroll

const contractName = "ActivityPointsAlt";

const statsAddress = "0x8A6d7926Db502Bb5b9Ffbcc2FF195623f52040C8"; // stats contract
const mintedPostsStatsAddress = "0xde16C1c780f32cF8dB6F6F41a58B2D4e91B86fd3";
const tldAddress = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";
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