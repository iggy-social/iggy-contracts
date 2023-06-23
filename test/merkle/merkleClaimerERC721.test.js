// npx hardhat test test/merkle/merkleClaimerERC721.test.js

const { expect } = require("chai");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

function calculateGasCosts(testName, receipt) {
  console.log(testName + " gasUsed: " + receipt.gasUsed);

  // coin prices in USD
  const matic = 1.5;
  const eth = 1500;
  
  const gasCostMatic = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("500", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostEthereum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("50", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostArbitrum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("1.25", "gwei")) * Number(receipt.gasUsed)), "ether");

  console.log(testName + " gas cost (Ethereum): $" + String(Number(gasCostEthereum)*eth));
  console.log(testName + " gas cost (Arbitrum): $" + String(Number(gasCostArbitrum)*eth));
  console.log(testName + " gas cost (Polygon): $" + String(Number(gasCostMatic)*matic));
}

describe("MerkleClaimerERC721", function () {
  let nftContract;
  let merkleClaimerContract;

  let owner;
  let user1;
  let user2;
  let user3;
  let user4;

  let claimers;
  let tree; // merkle tree

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // deploy nft contract
    const MockErc721WithMinter = await ethers.getContractFactory("MockErc721WithMinter");
    nftContract = await MockErc721WithMinter.deploy("Iggy NFT", "IGGY");
    await nftContract.deployed();

    // claimers
    claimers = [
      [owner.address, 1],
      [user1.address, 1],
      [user3.address, 1]
    ];

    // create merkle tree
    tree = StandardMerkleTree.of(claimers, ["address", "uint256"]);

    console.log("Merkle root: " + tree.root);

    // deploy nft minter
    const MerkleClaimerERC721 = await ethers.getContractFactory("MerkleClaimerERC721");
    merkleClaimerContract = await MerkleClaimerERC721.deploy(nftContract.address, tree.root);
    await merkleClaimerContract.deployed();

    // add minter address to nft contract
    await nftContract.setMinterAddress(merkleClaimerContract.address);
    
  });
  
  it("can claim NFT if listed among claimers", async function () {
    // check owner's NFT balance before claim
    const ownerNftBalanceBefore = await nftContract.balanceOf(owner.address);
    expect(ownerNftBalanceBefore).to.equal(0);

    // owner claims NFT
    const indexOwner = claimers.findIndex(item => item[0] === owner.address);
    //console.log("indexOwner: " + indexOwner);

    const proofOwner = tree.getProof(indexOwner);
    //console.log("proofOwner: " + proofOwner);

    const txOwner = await merkleClaimerContract.connect(owner).claim(owner.address, proofOwner);
    const receiptOwner = await txOwner.wait();
    calculateGasCosts("claimNFT owner", receiptOwner);

    // check owner's NFT balance after claim
    const ownerNftBalanceAfter = await nftContract.balanceOf(owner.address);
    expect(ownerNftBalanceAfter).to.equal(1);

    // check user1's NFT balance before claim
    const user1NftBalanceBefore = await nftContract.balanceOf(user1.address);
    expect(user1NftBalanceBefore).to.equal(0);

    // user1 claims NFT
    const indexUser1 = claimers.findIndex(item => item[0] === user1.address);
    //console.log("indexUser1: " + indexUser1);

    const proofUser1 = tree.getProof(indexUser1);
    //console.log("proofUser1: " + proofUser1);

    const txUser1 = await merkleClaimerContract.connect(user1).claim(user1.address, proofUser1);
    const receiptUser1 = await txUser1.wait();
    calculateGasCosts("claimNFT user1", receiptUser1);

    // check user1's NFT balance after claim
    const user1NftBalanceAfter = await nftContract.balanceOf(user1.address);
    expect(user1NftBalanceAfter).to.equal(1);

    // check user2's NFT balance before claim
    const user2NftBalanceBefore = await nftContract.balanceOf(user2.address);
    expect(user2NftBalanceBefore).to.equal(0);

    // user2 fails to claim NFT (uses wrong proof)
    await expect(merkleClaimerContract.connect(user2).claim(user2.address, proofUser1)).to.be.revertedWith("MerkleClaimerERC721: Invalid proof");

    // check user2's NFT balance after claim
    const user2NftBalanceAfter = await nftContract.balanceOf(user2.address);
    expect(user2NftBalanceAfter).to.equal(0);

  });


});