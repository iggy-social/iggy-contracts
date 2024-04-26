// npx hardhat run scripts/activity-points/other/activityPointsBasePunk.deploy.js --network base

const contractName = "ActivityPointsBasePunk";

const keyStatsAddress = "0x1625F2c759004726273fecd1449F882d5Bf6F76F"; 
const mintedPostsStatsAddress = "0xDA07Ef226E212f548979339BFEb13160C1d52f30";
const nftStatsAddress = "0x26Ea4872Ed43d9FedC240CC4dEB1DD06d6546856"; // launchpad
const tldStatsAddress = "0xC316f4a7a0f663ae0790d75eEfcF4a0d212a5472";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    keyStatsAddress,
    mintedPostsStatsAddress,
    nftStatsAddress,
    tldStatsAddress
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + keyStatsAddress + " " + mintedPostsStatsAddress + " " + nftStatsAddress + " " + tldStatsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });