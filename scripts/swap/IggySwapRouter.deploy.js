// npx hardhat run scripts/swap/IggySwapRouter.deploy.js --network polygonMumbai

const contractName = "IggySwapRouter";

const frontendAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";
const iggyAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D";
const routerAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const stakingAddress = "0x96Dc7548fD018d1E51d2d5e98B265411C3D0F22A";
const statsAddress = "0xfc31E770d80dBC6733ECa738d0c3b62A4b04d62D"; // stats middleware address

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