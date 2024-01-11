// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network arbitrumNova

const contractName = "ActivityPoints";

const statsAddress = "0xabf9960132818049340253C3Ca0551F92Db856d7"; // stats contract
const mintedPostsStatsAddress = "0xF40284a811c82b4B9ab22E94Bb909Df6d2c66C08";
const tldStatsAddress = ethers.constants.AddressZero;
const multiplier = 100000; // 1 wei = 100 points

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