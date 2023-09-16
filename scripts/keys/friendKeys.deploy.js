// 2. Deploy FriendKeys contract and automatically add it's address to the KeyStats contract.
// npx hardhat run scripts/keys/friendKeys.deploy.js --network flare

const contractName = "FriendKeys";

const tldAddress = "0xBDACF94dDCAB51c39c2dD50BffEe60Bb8021949a";
const feeReceiver = "0xFbaf1D1fBC5a2Fe2e48858a8A4585d5e7C12fc4A"; // distributor contract address
const keyStatsAddress = "0x50045895e1983F39FDC149C9a5AC29C39BEA18fe";

const protocolFeePercent = ethers.utils.parseEther("0.05");
const domainHolderFeePercent = ethers.utils.parseEther("0.05");
const ratio = ethers.utils.parseEther("42069"); // 1 ETH for 16000 keys

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