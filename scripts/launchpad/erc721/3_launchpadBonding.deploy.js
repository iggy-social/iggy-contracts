// 3. Deploy IggyLaunchpad721Bonding contract.
// npx hardhat run scripts/launchpad/erc721/3_launchpadBonding.deploy.js --network superposition

const contractName = "IggyLaunchpad721Bonding";

const metadataAddress = "0xF2d0dad8945ec1E241aC8D549E9bd0A186756cDb";
const mintingFeeReceiver = "0xE08033d0bDBcEbE7e619c3aE165E7957Ab577961"; // revenue distributor contract address
const directoryAddress = "0xa1303d259B87f044404536638E2784DEe897B402";
const statsMiddlewareAddress = "0xfc79caeAc4F44e0eBaD2bE7F42bf134806850d9e";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("0.0019"); // price for creating a new NFT collection

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