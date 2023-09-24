// Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/metadataStaticColor.deploy.js --network flare

const contractName = "IggyPostMetadataStaticColor";

const colorCode = "#b35160";
const mdName = "FLR Chat Post";
const description = "FLR Chat is the first decentralized social network on Flare. Go visit here: https://flr.chat/";
const url = "https://flr.chat/post/";
const tldAddress = "0xBDACF94dDCAB51c39c2dD50BffEe60Bb8021949a";

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