// npx hardhat run scripts/swap/IggySwapRouterSolidly.deploy.js --network base

const contractName = "IggySwapRouterSolidly";

const frontendAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const iggyAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const routerAddress = "0xE11b93B61f6291d35c5a2beA0A9fF169080160cF";
const stakingAddress = "0x0000000000000000000000000000000000000000"; // zero address
const statsAddress = ""; // stats middleware address
const wethAddress = "0x4200000000000000000000000000000000000006";

const swapFee = 80; // 0.8%
const stakingShare = 0; // 80%
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
    statsAddress,
    wethAddress,
    swapFee,
    stakingShare,
    frontendShare
  );

  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // add this address to the Stats middleware contract
  console.log("Adding this address to the stats middleware contract:");
  const statsContract = await ethers.getContractFactory("StatsMiddleware");
  const statsInstance = await statsContract.attach(statsAddress);
  const tx1 = await statsInstance.addWriter(instance.address);
  await tx1.wait();
  console.log("Done!");

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log(
    "npx hardhat verify --network " + network.name + " " + instance.address + " " + frontendAddress + " " + 
    iggyAddress + " " + routerAddress + " " + stakingAddress + " " + statsAddress + " " + wethAddress + ' "' + swapFee + '" "' + stakingShare + '" "' + frontendShare + '"'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });