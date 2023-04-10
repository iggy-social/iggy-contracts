// 4. Deploy enumeration contract
// npx hardhat run scripts/post/IggyPostNft1155/enumeration.deploy.js --network songbird

const contractName = "IggyPostEnumeration";

const minterAddress = "0xabf9960132818049340253C3Ca0551F92Db856d7";
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

  console.log(contractName + " contract address:", instance.address);

  await instance.deployed();

  // add enumeration address to minter contract
  const minterContract = new ethers.Contract(minterAddress, minterInterface, deployer);
  await minterContract.changeEnumAddress(instance.address);

  // enable/disable enumeration
  const isEnumEnabled = await minterContract.enumEnabled();

  if (isEnumEnabled && !shouldEnumBeEnabled) {
    await minterContract.toggleEnumEnabled();
  } else if (!isEnumEnabled && shouldEnumBeEnabled) {
    await minterContract.toggleEnumEnabled();
  }

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' ' + minterAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });