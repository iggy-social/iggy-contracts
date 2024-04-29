// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadata.deploy.js --network sepolia

const contractName = "IggyPostMetadata";

const mdName = "Iggy Demo Post";
const description = "Iggy Demo is a decentralized chat for the Iggy community. Go visit here: https://demo.iggy.social/";
const url = "https://demo.iggy.social/post/";
const tldAddress = "0x1DD820F4f48eBC2B8e7F666F34fbC5820808074e";

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