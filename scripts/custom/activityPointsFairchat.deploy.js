// npx hardhat run scripts/custom/activityPointsFairchat.deploy.js --network zkfair

const contractName = "ActivityPointsFairchat";

const statsAddress = "0x0BF6333Fc85159663A30Ac89FD02c5031B97c5ee"; // stats contract
const mintedPostsStatsAddress = "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A";
const tldAddress = "0x4087fb91A1fBdef05761C02714335D232a2Bf3a1";
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