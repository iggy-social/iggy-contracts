// 3. Deploy minter contract
// npx hardhat run scripts/post/IggyPostNft1155/3_minter.deploy.js --network scroll

const contractName = "IggyPostMinter";

const daoAddress = "0x0E66249733DDFe422F7A127B0b9E906601F23E06"; // distributor contract
const devAddress = "0xE08033d0bDBcEbE7e619c3aE165E7957Ab577961"; // iggy address
const postAddress = "0xa9cfa4e8EA79537F5893f45c3B1491A2f7B54e7E";

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