// 1. Deploy FriendKeys contract and automatically add it's address to the Stats middleware contract.
// npx hardhat run scripts/keys/1_friendKeys.deploy.js --network base

const contractName = "FriendKeys";

const tldAddress = "0x273dB54929d8392c1997Be361Da89D41af202a49";
const feeReceiver = "0x068B16f737ad4489B0f3b60C3AdF144Ea24C9273"; // distributor contract address
const statsAddress = "0xe80A5619DCf6a3C2AC129841a1eDeb9e8d402942"; // stats middleware contract address

const protocolFeePercent = ethers.utils.parseEther("0.05"); // 1 is 100%
const domainHolderFeePercent = ethers.utils.parseEther("0.05"); // 1 is 100%
const ratio = ethers.utils.parseEther("1"); // 1 ETH for 16000 keys

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    tldAddress, 
    feeReceiver,
    statsAddress,
    protocolFeePercent,
    domainHolderFeePercent,
    ratio
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
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + tldAddress + " " + feeReceiver + " " + statsAddress + ' "' + protocolFeePercent + '" "' + domainHolderFeePercent + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });