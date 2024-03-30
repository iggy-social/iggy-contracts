// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network degen

const contractName = "ActivityPoints";

const statsAddress = "0x633Ae857445cF0cd02B21C6a3033C7CE74fB32c2"; // stats contract
const mintedPostsStatsAddress = "0x0BF6333Fc85159663A30Ac89FD02c5031B97c5ee";
const tldStatsAddress = ethers.constants.AddressZero;
const multiplier = 10; // 1 eth = 10 points

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