// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network polygonMumbai

const contractName = "ActivityPoints";

const statsAddress = "0xfc31E770d80dBC6733ECa738d0c3b62A4b04d62D"; // stats contract
const mintedPostsStatsAddress = "0xe336676aC859785CECe2659317176304DB2DF808";
const tldStatsAddress = ethers.constants.AddressZero;
const multiplier = 100000; // 1 wei = 1000 points

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