// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network polygon

const contractName = "ActivityPoints";

const statsAddress = "0x06A7Ab7Bb68b0ad6eB7688C5781E60BE6AFc658d"; // stats contract
const mintedPostsStatsAddress = "";
const tldStatsAddress = ethers.constants.AddressZero;
const multiplier = 100; // 1 wei = 100 points

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