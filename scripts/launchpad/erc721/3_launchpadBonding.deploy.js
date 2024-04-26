// 3. Deploy IggyLaunchpad721Bonding contract.
// npx hardhat run scripts/launchpad/erc721/3_launchpadBonding.deploy.js --network base

const contractName = "IggyLaunchpad721Bonding";

const metadataAddress = "0x3cBD8BA9A8897D14a2B826D12adde0aE675174Dc";
const mintingFeeReceiver = "0x068B16f737ad4489B0f3b60C3AdF144Ea24C9273"; // revenue distributor contract address
const directoryAddress = "0xEdE68a694E4730F997dcA54A9C9f817D86605FF5";
const statsMiddlewareAddress = "0xe80A5619DCf6a3C2AC129841a1eDeb9e8d402942";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("1"); // price for creating a new NFT collection

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    metadataAddress,
    mintingFeeReceiver,
    directoryAddress,
    statsMiddlewareAddress,
    mintingFeePercentage,
    price
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // create a stats middleware contract instance
  if (statsMiddlewareAddress != ethers.constants.AddressZero) {
    const statsMiddlewareContract = await ethers.getContractFactory("StatsMiddleware");
    const statsMiddlewareInstance = await statsMiddlewareContract.attach(statsMiddlewareAddress);

    // set the launchpad contract address as writer in the stats middleware contract (addWriter function)
    console.log("Adding " + contractName + " contract as writer in the stats middleware contract...");
    const tx1 = await statsMiddlewareInstance.addWriter(instance.address);
    await tx1.wait();
  }

  // create a directroy contract instance
  const directoryContract = await ethers.getContractFactory("NftDirectory");
  const directoryInstance = await directoryContract.attach(directoryAddress);

  // set the launchpad contract address as writer in the directory contract (addWriter function)
  console.log("Adding " + contractName + " contract as writer in the directory contract...");
  const tx2 = await directoryInstance.addWriter(instance.address);
  await tx2.wait();

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + metadataAddress + " " + mintingFeeReceiver + " " + directoryAddress + " " + statsMiddlewareAddress + ' "' + mintingFeePercentage + '" "' + price + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });