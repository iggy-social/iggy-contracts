// 3. Deploy minter contract
// npx hardhat run scripts/post/IggyPostNft1155/3_minter.deploy.js --network degen

const contractName = "IggyPostMinter";

const daoAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D"; // distributor contract
const devAddress = "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"; // iggy address
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

  await instance.deployed();

  console.log("Contract deployed to:", instance.address);

  console.log("Changing minter address in post contract...");

  // change minter address in post contract
  const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  await postContract.ownerChangeMinterAddress(instance.address);

  console.log("Done!");
  
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