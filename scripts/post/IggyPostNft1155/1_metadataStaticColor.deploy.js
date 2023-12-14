// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadataStaticColor.deploy.js --network optimisticEthereum

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#8050E3";
const mdName = "Pool Chat Post";
const description = "Web3 Social chat for the PoolTogether DAO community. Go visit here: https://chat.pooly.me/";
const url = "https://chat.pooly.me/post/";
const tldAddress = "0xf2C9E463592BD440f0D422E944E5F95c79404586";

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