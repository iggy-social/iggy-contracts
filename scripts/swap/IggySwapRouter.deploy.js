// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network degen

const contractName = "IggySwapRouter";

const iggyAddress = "0x5193877dD31b569Fedf762308aFae70B9091b951"; // mandatory
const routerAddress = "0x5a8e4e0dd630395b5afb8d3ac5b3ef269f0c8356"; // mandatory
const frontendAddress = "0x5193877dD31b569Fedf762308aFae70B9091b951"; // optional
const stakingAddress = ethers.constants.AddressZero; // optional
const statsAddress = "0x06A7Ab7Bb68b0ad6eB7688C5781E60BE6AFc658d"; // stats middleware address (optional)

const swapFee = 80; // 0.8%
const stakingShare = 0; // bps
const frontendShare = 5000; // bps

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