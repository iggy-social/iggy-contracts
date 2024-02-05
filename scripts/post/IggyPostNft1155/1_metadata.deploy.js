// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadata.deploy.js --network scroll

const contractName = "IggyPostMetadata";

const mdName = "Scrolly Post";
const description = "Scrolly Hub is a web3 place for all-things around the Scrolly web3 community. Go visit here: https://hub.scrolly.xyz/";
const url = "https://hub.scrolly.xyz/post/";
const tldAddress = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";

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