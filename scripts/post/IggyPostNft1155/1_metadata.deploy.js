// 1. Deploy metadata contract
// npx hardhat run scripts/post/IggyPostNft1155/1_metadata.deploy.js --network degen

const contractName = "IggyPostMetadata";

const mdName = "NFTdegen.lol Post";
const description = "NFTdegen is an NFT launchpad and marketplace where NFTs are always liquid. Go visit here: https://nftdegen.lol/";
const url = "https://nftdegen.lol/post/";
const tldAddress = "0x4087fb91A1fBdef05761C02714335D232a2Bf3a1";

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