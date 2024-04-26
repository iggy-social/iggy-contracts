// npx hardhat run scripts/activity-points/other/activityPointsScrolly.deploy.js --network scrollTestnet

const contractName = "ActivityPointsScrolly";

const statsAddress = "0x633Ae857445cF0cd02B21C6a3033C7CE74fB32c2"; // stats contract (not middleware)
const mintedPostsStatsAddress = ethers.constants.AddressZero; // minted posts stats contract
const tldAddress = "0x4087fb91A1fBdef05761C02714335D232a2Bf3a1";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    statsAddress,
    mintedPostsStatsAddress,
    tldAddress
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + statsAddress + " " + mintedPostsStatsAddress + " " + tldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });