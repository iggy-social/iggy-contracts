// npx hardhat run scripts/nft/early-stakers/earlyStakerNft.deploy.js --network polygonMumbai

const data = require("./claimers.json");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const metadataContractName = "EarlyStakerMetadata";
const nftContractName = "EarlyStakerNft";
const claimerContractName = "MerkleClaimerERC721";

// metadata
const description = "Commemorative NFT for early SGB Chat stakers.";
const externalUrl = "https://sgb.chat";
const name = "Early SGB Chat Staker";
const video = "https://bafybeibajqsxbuihg4jxsmlnees2gytagp4gqwxr2sielhe2bcbgrjbi2y.ipfs.w3s.link/early-staker-nft-sgb-chat-2.mp4";

const nftName = "SGB Chat Early Staker";
const nftSymbol = "SCES";

// create merkle tree
tree = StandardMerkleTree.of(data.claimers, ["address", "uint256"]); // TODO: Make sure you have the right data in claimers.json
const merkleRoot = String(tree.root);

console.log("Merkle root: " + merkleRoot);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy metadata contract
  console.log("Deploying " + metadataContractName + " contract");
  const metadataContract = await ethers.getContractFactory(metadataContractName);
  const metadataInstance = await metadataContract.deploy(
    description,
    externalUrl,
    name,
    video
  );
  await metadataInstance.deployed();

  console.log(metadataContractName + " contract address:", metadataInstance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + metadataInstance.address + ' "' + description + '" "' + externalUrl + '" "' + name + '" "' + video + '"');

  // deploy NFT contract
  console.log("Deploying " + nftContractName + " contract");
  const nftContract = await ethers.getContractFactory(nftContractName);
  const nftInstance = await nftContract.deploy(
    metadataInstance.address,
    nftName,
    nftSymbol
  );
  await nftInstance.deployed();

  console.log(nftContractName + " contract address:", nftInstance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + nftInstance.address + " " + metadataInstance.address + ' "' + nftName + '" "' + nftSymbol + '"');

  // deploy claimer contract
  console.log("Deploying " + claimerContractName + " contract");
  const claimerContract = await ethers.getContractFactory(claimerContractName);
  const claimerInstance = await claimerContract.deploy(
    nftInstance.address,
    merkleRoot
  );
  await claimerInstance.deployed();
  
  console.log(claimerContractName + " contract address:", claimerInstance.address);

  // add minter address to nft contract
  console.log("Adding minter address to " + nftContractName + " contract");
  await nftInstance.changeMinterAddress(claimerInstance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + claimerInstance.address + " " + nftInstance.address + " " + merkleRoot);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });