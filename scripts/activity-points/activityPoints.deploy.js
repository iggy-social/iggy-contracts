// npx hardhat run scripts/activity-points/activityPoints.deploy.js --network polygonMumbai

const contractName = "ActivityPoints";

const keyStatsAddress = "0x656b16555563167d7F78557Ec5Ed4292630F72EF";
const mintedPostsStatsAddress = "0xFCF878b629fF0Ef3bC033eFfCfFD39B00c9a68C5";
const nftStatsAddress = "0x8437dC33089B4Bd349566aa84825720f16954962";
const tldStatsAddress = ethers.constants.AddressZero;

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