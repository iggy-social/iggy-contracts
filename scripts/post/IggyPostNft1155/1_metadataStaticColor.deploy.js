// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadataStaticColor.deploy.js --network arbitrumOne

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#5DC4FF";
const mdName = "AlwaysLiquid Arbi Post";
const description = "Social NFT Marketplace on Arbitrum, where NFTs are always liquid. Go visit here: https://arbi.alwaysliquid.com/";
const url = "https://arbi.alwaysliquid.com/post/";
const tldAddress = "0xe97456E0fB121F65422F43ccbd4A07a0e269B534";

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