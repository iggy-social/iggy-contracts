// 3. Deploy minter contract
// npx hardhat run scripts/IggyPostNft1155/minter.deploy.js --network songbird

const contractName = "IggyPostMinter";

const daoAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const devAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2";
const postAddress = "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A";

const daoFee = 1000; // 10%
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

  console.log(contractName + " contract address:", instance.address);

  await instance.deployed();

  // change minter address in post contract
  const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  await postContract.ownerChangeMinterAddress(instance.address);
  
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