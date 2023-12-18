// If verifying contract via step 3 does not work, use this script instead
// 4. Deploy mock/test Nft721Bonding contract so that others created through factory can get auto-verified.
// npx hardhat run scripts/launchpad/erc721/4_mockNftContract.js --network opera

const contractName = "Nft721Bonding";

const factoryAddress = "0x7c8fbdb5Bd20Ae239c3e3BfD775663c6989B17CD";
const metadataAddress = "0xA48a1Be7ef2BA7A80aF426a7ca3697D3eaBc53ba";
const mintingFeeReceiver = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const cName = "Test collection";
const cSymbol = "TEST";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const ratio = ethers.utils.parseEther("4200");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    factoryAddress,
    metadataAddress,
    mintingFeeReceiver,
    cName,
    cSymbol,
    mintingFeePercentage,
    ratio
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + factoryAddress + " " + metadataAddress + " " + mintingFeeReceiver + ' "' + cName + '" "' + cSymbol + '" "' + mintingFeePercentage + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });