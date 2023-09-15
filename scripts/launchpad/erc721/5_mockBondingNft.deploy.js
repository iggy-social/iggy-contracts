// 5. Deploy mock/test Nft721Bonding contract so that others created through factory can get auto-verified.
// npx hardhat run scripts/launchpad/erc721/5_mockBondingNft.deploy.js --network base

const contractName = "Nft721Bonding";

const factoryAddress = "0xa9cfa4e8EA79537F5893f45c3B1491A2f7B54e7E";
const metadataAddress = "0xa6b7116A5b6eF4e1336980dF4FB162eeBC38b766";
const mintingFeeReceiver = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const collectionPreviewImage = "img.jpg";
const cName = "Test collection";
const cSymbol = "TEST";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const ratio = ethers.utils.parseEther("1");

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
    collectionPreviewImage,
    cName,
    cSymbol,
    mintingFeePercentage,
    ratio
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + factoryAddress + " " + metadataAddress + " " + mintingFeeReceiver + ' "' + collectionPreviewImage + '" "' + cName + '" "' + cSymbol + '" "' + mintingFeePercentage + '" "' + ratio + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });