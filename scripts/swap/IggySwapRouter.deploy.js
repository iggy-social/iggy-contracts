// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network songbird

const contractName = "IggySwapRouter";

const frontendAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";
const iggyAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";
const routerAddress = "0xB0F6F956CE004438926299712aAB1Ff97De7254e";
const stakingAddress = "0xCA9749778327CD67700d3a777731a712330beB9A";
const statsAddress = ""; // stats middleware address

const swapFee = 80; // 0.8%
const stakingShare = 9999; 
const frontendShare = 8000; // 100% of what's left after staking share and referral share are taken out

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
  console.log("Adding this address to the stats middleware contract:");
  const statsContract = await ethers.getContractFactory("StatsMiddleware");
  const statsInstance = await statsContract.attach(statsAddress);
  const tx1 = await statsInstance.addWriter(instance.address);
  await tx1.wait();
  console.log("Done!");

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