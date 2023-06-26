// npx hardhat run scripts/merkle/merkleClaimerERC721.deploy.js --network polygonMumbai

const data = require("./claimers.json");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const contractName = "MerkleClaimerERC721";
const nftContractName = "EarlyStakerNft"; // TODO: Update this contract name

const nftAddress = ""; // TODO: address of deployed nft contract

// create merkle tree
tree = StandardMerkleTree.of(data.claimers, ["address", "uint256"]); // TODO: Make sure you have the right data in claimers.json
const merkleRoot = String(tree.root);

console.log("Merkle root: " + merkleRoot);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    nftAddress,
    merkleRoot
  );
  
  console.log(contractName + " contract address:", instance.address);

  // add minter address to nft contract
  const nftContract = await ethers.getContractFactory(nftContractName);
  const nftInstance = await nftContract.attach(nftAddress);

  await nftInstance.changeMinterAddress(instance.address);

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + " " + nftAddress + " " + merkleRoot);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });