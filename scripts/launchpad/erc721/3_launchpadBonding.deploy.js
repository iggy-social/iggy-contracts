// 3. Deploy IggyLaunchpad721Bonding contract.
// npx hardhat run scripts/launchpad/erc721/3_launchpadBonding.deploy.js --network arbitrumNova

const contractName = "IggyLaunchpad721Bonding";

const metadataAddress = "0xc486B08Ed47fFe5c1b4b1A2ff5c671EA0083D9bA";
const mintingFeeReceiver = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // revenue distributor contract address
const directoryAddress = "0x6AbDd1Bf5078cC6b0D75caFCdDC69A8339067F50";
const statsMiddlewareAddress = "0xce314209aB485bE222CE85F653Ac918f54532503";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("0.0001"); // price for creating a new NFT collection

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
  const statsMiddlewareContract = await ethers.getContractFactory("StatsMiddleware");
  const statsMiddlewareInstance = await statsMiddlewareContract.attach(statsMiddlewareAddress);

  // set the launchpad contract address as writer in the stats middleware contract (addWriter function)
  console.log("Adding " + contractName + " contract as writer in the stats middleware contract...");
  const tx1 = await statsMiddlewareInstance.addWriter(instance.address);
  await tx1.wait();

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