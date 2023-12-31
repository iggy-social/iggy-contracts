// npx hardhat run scripts/custom/activityPointsAlt.deploy.js --network polygon

const contractName = "ActivityPointsAlt";

const statsAddress = "0x06A7Ab7Bb68b0ad6eB7688C5781E60BE6AFc658d"; // stats contract
const mintedPostsStatsAddress = "0xce314209aB485bE222CE85F653Ac918f54532503";
const tldAddress = "0x70Ac07C50131b7bb2c8Bd9466D8d2add30B7759f";
const multiplier = 10; // 1 wei = 1000 points

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