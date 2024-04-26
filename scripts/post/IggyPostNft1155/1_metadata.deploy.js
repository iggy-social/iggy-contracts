// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadata.deploy.js --network base

const contractName = "IggyPostMetadata";

const mdName = "Based Chat Post";
const description = "Based Chat is a decentralized chat for the Based Nouns community. Go visit here: https://chat.basednames.xyz/";
const url = "https://chat.basednames.xyz/post/";
const tldAddress = "0x273dB54929d8392c1997Be361Da89D41af202a49";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(mdName, description, url, tldAddress);
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + mdName + '" "' + description + '" "' + url + '" ' + tldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });