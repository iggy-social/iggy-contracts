// 4. Deploy stats contract
// npx hardhat run scripts/post/IggyPostNft1155/4_stats.deploy.js --network polygon

const contractName = "IggyPostStats";

const minterAddress = "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A";
const shouldStatsBeEnabled = true;

const minterInterface = new ethers.utils.Interface([
  "function changeStatsAddress(address _statsAddress) external",
  "function statsEnabled() external view returns (bool)",
  "function toggleStatsEnabled() external"
]);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(minterAddress);

  await instance.deployed();

  console.log(contractName + " contract deployed to:", instance.address);

  console.log("Changing stats address in minter contract...");

  // add stats address to minter contract
  const minterContract = new ethers.Contract(minterAddress, minterInterface, deployer);
  const changeStatsAddrTx = await minterContract.changeStatsAddress(instance.address);
  await changeStatsAddrTx.wait();

  console.log("Done!");

  console.log("Changing statsEnabled in minter contract...");

  // enable/disable stats
  const isStatsEnabled = await minterContract.statsEnabled();

  if (isStatsEnabled && !shouldStatsBeEnabled) {
    await minterContract.toggleStatsEnabled();
  } else if (!isStatsEnabled && shouldStatsBeEnabled) {
    await minterContract.toggleStatsEnabled();
  }

  console.log("Done!");

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' ' + minterAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });