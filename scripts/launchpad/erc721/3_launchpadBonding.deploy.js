// 3. Deploy IggyLaunchpad721Bonding contract.
// npx hardhat run scripts/launchpad/erc721/3_launchpadBonding.deploy.js --network degen

const contractName = "IggyLaunchpad721Bonding";

const metadataAddress = "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e";
const mintingFeeReceiver = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D"; // revenue distributor contract address
const directoryAddress = "0x4A82158ff4B0504F3DB4c7555FfB6298452985E2";
const statsMiddlewareAddress = "0x06A7Ab7Bb68b0ad6eB7688C5781E60BE6AFc658d";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const price = ethers.utils.parseEther("420"); // price for creating a new NFT collection

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