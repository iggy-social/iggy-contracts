// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadataStaticColor.deploy.js --network base

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#e4007b";
const mdName = "BasePunk Chat Post";
const description = "BasePunk Chat is a Web3 Social app for the BasePunk NFT community. Go visit here: https://chat.basepunk.xyz/";
const url = "https://chat.basepunk.xyz/post/";
const tldAddress = "0xc2C543D39426bfd1dB66bBde2Dd9E4a5c7212876";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(colorCode, mdName, description, url, tldAddress);
  
  console.log(contractName + " contract address:", instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + colorCode + '" "' + mdName + '" "' + description + '" "' + url + '" ' + tldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });