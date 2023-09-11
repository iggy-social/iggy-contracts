// 2. Deploy FriendKeys contract and automatically add it's address to the KeyStats contract.
// npx hardhat run scripts/keys/friendKeys.deploy.js --network base

const contractName = "FriendKeys";

const tldAddress = "";
const feeReceiver = "";
const keyStatsAddress = "";

const protocolFeePercent = ethers.utils.parseEther("0.05");
const domainHolderFeePercent = ethers.utils.parseEther("0.05");
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
    keyStatsAddress,
    protocolFeePercent,
    domainHolderFeePercent,
    ratio
  );

  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Adding this address to the KeyStats contract:");

  // add this address to the KeyStats contract
  const keyStatsContract = await ethers.getContractFactory("KeyStats");
  const keyStatsInstance = await keyStatsContract.attach(keyStatsAddress);

  const tx1 = await keyStatsInstance.setSubmitter(instance.address);
  await tx1.wait();

  console.log("Done!");

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + tldAddress + " " + feeReceiver + " " + keyStatsAddress + ' "' + protocolFeePercent + '" "' + domainHolderFeePercent + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });