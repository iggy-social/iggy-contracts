// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network taikoKatla

const contractName = "IggySwapRouter";

const iggyAddress = ""; // mandatory
const routerAddress = ""; // mandatory
const frontendAddress = ethers.constants.AddressZero; // optional
const stakingAddress = ethers.constants.AddressZero; // optional
const statsAddress = ""; // stats middleware address (optional)

const swapFee = 80; // 0.8%
const stakingShare = 4000; // bps
const frontendShare = 4000; // bps

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
    swapFee,
    stakingShare,
    frontendShare
  );

  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // add this address to the Stats middleware contract
  if (statsAddress != ethers.constants.AddressZero) {
    console.log("Adding this address to the stats middleware contract:");
    const statsContract = await ethers.getContractFactory("StatsMiddleware");
    const statsInstance = await statsContract.attach(statsAddress);
    const tx1 = await statsInstance.addWriter(instance.address);
    await tx1.wait();
    console.log("Done!");
  }

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log(
    "npx hardhat verify --network " + network.name + " " + instance.address + " " + frontendAddress + " " + 
    iggyAddress + " " + routerAddress + " " + stakingAddress + " " + statsAddress + ' "' + swapFee + '" "' + stakingShare + '" "' + frontendShare + '"'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });