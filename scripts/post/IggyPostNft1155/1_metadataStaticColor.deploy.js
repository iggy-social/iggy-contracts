// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadataStaticColor.deploy.js --network polygon

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#884bf2";
const mdName = "Always Liquid Polygon Post";
const description = "Social NFT marketplace where NFTs are always liquid. Go visit here: https://polygon.alwaysliquid.com/";
const url = "https://polygon.alwaysliquid.com/post/";
const tldAddress = "0x70Ac07C50131b7bb2c8Bd9466D8d2add30B7759f";

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