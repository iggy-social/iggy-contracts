// Deploy metadata contract
// npx hardhat run scripts/IggyPostNft1155/minter.deploy.js --network polygonMumbai

const contractName = "IggyPostMinter";

const daoAddress = "";
const devAddress = "";
const postAddress = "";

const daoFee = 2000; // 20%
const devFee = 1000; // 10%
const refFee = 1000; // 10%

const postInterface = new ethers.utils.Interface([
  "function ownerChangeMinterAddress(address _newMinterAddress) external"
]);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(daoAddress, devAddress, postAddress, daoFee, devFee, refFee);
  await instance.deployed();

  // change minter address in post contract
  const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  await postContract.ownerChangeMinterAddress(instance.address);
  
  console.log("Contract address:", instance.address);

  // verify contracts
  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + daoAddress + " " + devAddress + " " + postAddress + ' "' + daoFee + '" "' + devFee + '" "' + refFee + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });