// 1. Deploy FriendKeys contract and automatically add it's address to the Stats middleware contract.
// npx hardhat run scripts/keys/1_friendKeys.deploy.js --network sepolia

const contractName = "FriendKeys";

const tldAddress = "0x1DD820F4f48eBC2B8e7F666F34fbC5820808074e";
const feeReceiver = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // distributor contract address
const statsAddress = "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A"; // stats middleware contract address

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