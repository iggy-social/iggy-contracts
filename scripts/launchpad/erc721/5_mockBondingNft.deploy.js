// 5. Deploy mock/test Nft721Bonding contract so that others created through factory can get auto-verified.
// npx hardhat run scripts/launchpad/erc721/5_mockBondingNft.deploy.js --network songbird

const contractName = "Nft721Bonding";

const factoryAddress = "0x8793834eDd8aDD064066aB5afF84792FD70F5E29";
const metadataAddress = "0x10DcC7E9b3bbAE6875DCa8616DFe4af4153E1382";
const mintingFeeReceiver = "0xb29050965a5ac70ab487aa47546cdcbc97dae45d";
const collectionPreviewImage = "img.jpg";
const cName = "Test collection";
const cSymbol = "TEST";
const mintingFeePercentage = ethers.utils.parseEther("0.02");
const ratio = ethers.utils.parseEther("6969");

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