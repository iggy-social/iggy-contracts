// npx hardhat run scripts/nft/early-stakers/onlyMetadata.deploy.js --network polygonMumbai

const contractName = "EarlyStakerMetadata";

const description = "Commemorative NFT for early SGB Chat stakers.";
const externalUrl = "https://sgb.chat";
const image = "ipfs://bafybeic3fpbvtqj6kqpu77vy56efkasgbaviguc3qm4jgy3dy7fuk7fire/early-staker-nft-sgb-chat.png";
const mdName = "Early SGB Chat Staker";
const video = "ipfs://bafybeibajqsxbuihg4jxsmlnees2gytagp4gqwxr2sielhe2bcbgrjbi2y/early-staker-nft-sgb-chat-2.mp4";

const nftAddress = "0x8e769129F8CAc93d2EF1c46a4d3E6Fa32Bc7b569";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const metadataInstance = await contract.deploy(
    description,
    externalUrl,
    image,
    mdName,
    video
  );
  await metadataInstance.deployed();

  // add metadata address to the NFT contract
  const nftContract = await ethers.getContractFactory("EarlyStakerNft");
  const nftInstance = await nftContract.attach(nftAddress);
  await nftInstance.changeMetadataAddress(metadataInstance.address);

  console.log(contractName + " contract address:", metadataInstance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + metadataInstance.address + ' "' + description + '" "' + externalUrl + '" "' + image + '" "' + mdName + '" "' + video + '"');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });