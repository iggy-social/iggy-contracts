// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network base

const contractName = "IggySwapRouter";

const frontendAddress = "0xd688b5ed29ab77b39884babd1930213bf7805cd1";
const iggyAddress = "0xe08033d0bdbcebe7e619c3ae165e7957ab577961";
const routerAddress = "0x327df1e6de05895d2ab08513aadd9313fe505d86";
const stakingAddress = "0x0000000000000000000000000000000000000000";

const swapFee = 80; // 0.8%
const stakingShare = 0; 
const frontendShare = 5000; // 50% of what's left after staking share and referral share are taken out

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