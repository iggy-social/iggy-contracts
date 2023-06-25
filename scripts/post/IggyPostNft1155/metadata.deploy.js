// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/metadata.deploy.js --network optimisticGoerli

const contractName = "IggyPostMetadata";

const mdName = "Opti Social Post";
const description = "Opti Social - The first decentralized social network on Optimism Goerli.";
const url = "https://opti.social/post/";
const tldAddress = "0x320881Fff17c9a2189226c61ad1157DFF80b18B5";

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