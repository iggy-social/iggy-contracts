// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network base

const contractName = "IggySwapRouter";

const frontendAddress = "0x0000000000000000000000000000000000000000";
const iggyAddress = "0x6771f33cfd8c6fc0a1766331f715f5d2e1d4e0e2";
const routerAddress = "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86";
const stakingAddress = "0x0000000000000000000000000000000000000000";

const swapFee = 80; // 0.8%
const stakingShare = 0; // 80%
const frontendShare = 0; // 50% of what's left after staking share and referral share are taken out

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    frontendAddress,
    iggyAddress,
    routerAddress,
    stakingAddress,
    swapFee,
    stakingShare,
    frontendShare
  );
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log(
    "npx hardhat verify --network " + network.name + " " + instance.address + " " + frontendAddress + " " + 
    iggyAddress + " " + routerAddress + " " + stakingAddress + ' "' + swapFee + '" "' + stakingShare + '" "' + frontendShare + '"'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });