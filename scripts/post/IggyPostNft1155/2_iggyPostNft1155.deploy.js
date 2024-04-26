// 2. Deploy NFT contract
// npx hardhat run scripts/post/IggyPostNft1155/2_iggyPostNft1155.deploy.js --network base

const contractName = "IggyPostNft1155";

const defaultPrice = ethers.utils.parseEther("0.0006"); // TODO: change price!!!
const metadataAddress = "0x597d2389D5845d1A38CCa3e7964B337E5D485898";
const collectionName = "Based Chat Posts";
const collectionSymbol = "BASEDCHATPOST";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(defaultPrice, metadataAddress, collectionName, collectionSymbol);
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + defaultPrice + '" ' + metadataAddress + ' "' + collectionName + '" "' + collectionSymbol + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });