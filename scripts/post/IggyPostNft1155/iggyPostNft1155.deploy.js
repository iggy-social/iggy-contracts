// 2. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/iggyPostNft1155.deploy.js --network songbird

const contractName = "IggyPostNft1155";

const defaultPrice = ethers.utils.parseEther("99");
const metadataAddress = "0x2D4144B4E00cf1dC1c4DeDa37cb1CaCEda030998";
const collectionName = "sgb.chat";
const collectionSymbol = "SGBCHAT";

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