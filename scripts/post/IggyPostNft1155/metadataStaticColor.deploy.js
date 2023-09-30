// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/metadataStaticColor.deploy.js --network polygonMumbai

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#8e85e6";
const mdName = "Iggy Social Demo Post";
const description = "Iggy Social is a Web3 Social template for DAOs and web3 communities. Go visit here: https://demo.iggy.social/";
const url = "https://demo.iggy.social/post/";
const tldAddress = "0x2582EC420195Fefb091B098da6FAdEE49f490740";

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