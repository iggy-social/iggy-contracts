// 3. Deploy minter contract
// npx hardhat run scripts/post/IggyPostNft1155/minter.deploy.js --network flare

const contractName = "IggyPostMinter";

const daoAddress = "0xFbaf1D1fBC5a2Fe2e48858a8A4585d5e7C12fc4A"; // distributor contract
const devAddress = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const postAddress = "0x5e54CebB2612744cB56547bC7CC41466ad7ac557";

const daoFee = 2000; // 20%
const devFee = 0; // 0%
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