// 4. Deploy IggyLaunchpad721Bonding contract.
// npx hardhat run scripts/launchpad/erc721/4_launchpadBonding.deploy.js --network flare

const contractName = "IggyLaunchpad721Bonding";

const metadataAddress = "0x1EB2Adc19eB3Df26D84427Be11F1eB1887c6631c";
const mintingFeeReceiver = "0xFbaf1D1fBC5a2Fe2e48858a8A4585d5e7C12fc4A"; // revenue distributor contract address
const statsMiddlewareAddress = "0x6AbDd1Bf5078cC6b0D75caFCdDC69A8339067F50";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("199"); // price for creating a new NFT collection

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    metadataAddress,
    mintingFeeReceiver,
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
  await statsMiddlewareInstance.addWriter(instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + metadataAddress + " " + mintingFeeReceiver + " " + statsMiddlewareAddress + ' "' + mintingFeePercentage + '" "' + price + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });