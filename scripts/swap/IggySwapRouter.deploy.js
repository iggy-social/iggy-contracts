// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network songbird

const contractName = "IggySwapRouter";

const frontendAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const iggyAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const routerAddress = "0x73E93D9657E6f32203f900fe1BD81179a5bf6Ce4";
const stakingAddress = "0xCA9749778327CD67700d3a777731a712330beB9A";

const swapFee = 80; // 0.8%
const stakingShare = 8000; // 80%
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