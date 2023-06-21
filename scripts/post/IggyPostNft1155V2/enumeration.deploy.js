// 4. Deploy enumeration contract
// npx hardhat run scripts/post/IggyPostNft1155V2/enumeration.deploy.js --network optimisticGoerli

const contractName = "IggyPostEnumeration";

const minterAddress = "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e";
const shouldEnumBeEnabled = true;

const minterInterface = new ethers.utils.Interface([
  "function changeEnumAddress(address _enumAddress) external",
  "function enumEnabled() external view returns (bool)",
  "function toggleEnumEnabled() external"
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

  console.log("Changing enumeration address in minter contract...");

  // add enumeration address to minter contract
  const minterContract = new ethers.Contract(minterAddress, minterInterface, deployer);
  await minterContract.changeEnumAddress(instance.address);

  console.log("Done!");

  console.log("Changing enumEnabled in minter contract...");

  // enable/disable enumeration
  const isEnumEnabled = await minterContract.enumEnabled();

  if (isEnumEnabled && !shouldEnumBeEnabled) {
    await minterContract.toggleEnumEnabled();
  } else if (!isEnumEnabled && shouldEnumBeEnabled) {
    await minterContract.toggleEnumEnabled();
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