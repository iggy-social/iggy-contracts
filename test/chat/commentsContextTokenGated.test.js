// npx hardhat test test/chat/commentsContextTokenGated.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

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

describe("CommentsContextTokenGated", function () {
  let commentsContract;
  let modTokenContract;
  let subjectTokenContract;
  let owner, user1, user2, user3;
  let subjectAddress;
  const price = ethers.utils.parseEther("0.00001");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockErc721 = await ethers.getContractFactory("MockErc721");
    modTokenContract = await MockErc721.deploy("ModToken", "MT");
    await modTokenContract.deployed();

    subjectTokenContract = await MockErc721.deploy("SubjectToken", "ST");
    await subjectTokenContract.deployed();

    const CommentsContextTokenGated = await ethers.getContractFactory("CommentsContextTokenGated");
    commentsContract = await CommentsContextTokenGated.deploy(
      modTokenContract.address,
      owner.address,
      1, // commentMinBalance
      1, // modMinBalance
      price
    );
    await commentsContract.deployed();

    // mint mod token to user1
    await modTokenContract.mint(user1.address);

    // mint subject token to user2
    await subjectTokenContract.mint(user2.address);

    subjectAddress = subjectTokenContract.address;
  });

  it("checks if state variables are set correctly", async function () {
    expect(await commentsContract.modTokenAddress()).to.equal(modTokenContract.address);
    expect(await commentsContract.modMinBalance()).to.equal(1);
    expect(await commentsContract.commentMinBalance()).to.equal(1);
    expect(await commentsContract.owner()).to.equal(owner.address);
    expect(await commentsContract.price()).to.equal(price);
  });

  it("allows creating a comment and sets the index correctly", async function () {
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await expect(tx).to.emit(commentsContract, "CommentPosted")
      .withArgs(user2.address, "ar://comment1", subjectAddress, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const comment = await commentsContract.getComment(subjectAddress, 0);
    expect(comment.author).to.equal(user2.address);
    expect(comment.url).to.equal("ar://comment1");
    expect(comment.deleted).to.be.false;
    expect(comment.index).to.equal(0);
  });

  it("prevents creating a comment without sufficient token balance", async function () {
    await expect(commentsContract.connect(user3).createComment(subjectAddress, "ar://comment1", { value: price }))
      .to.be.revertedWith("You do not have the minimum balance to post a comment");
  });

  it("allows author to delete their comment", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    const tx = await commentsContract.connect(user2).deleteComment(subjectAddress, 0);
    await expect(tx).to.emit(commentsContract, "CommentDeleted")
      .withArgs(user2.address, "ar://comment1", subjectAddress, 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const comment = await commentsContract.getComment(subjectAddress, 0);
    expect(comment.deleted).to.be.true;
  });

  it("allows mod to restore a deleted comment", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await commentsContract.connect(user2).deleteComment(subjectAddress, 0);
    const tx = await commentsContract.connect(user1).restoreComment(subjectAddress, 0);
    await expect(tx).to.emit(commentsContract, "CommentRestored")
      .withArgs(user1.address, "ar://comment1", subjectAddress, 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const comment = await commentsContract.getComment(subjectAddress, 0);
    expect(comment.deleted).to.be.false;
  });

  it("allows mod to pause and unpause the contract", async function () {
    await commentsContract.connect(user1).togglePaused();
    expect(await commentsContract.paused()).to.be.true;

    await commentsContract.connect(user1).togglePaused();
    expect(await commentsContract.paused()).to.be.false;
  });

  it("prevents creating comments when paused", async function () {
    await commentsContract.connect(user1).togglePaused();
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price }))
      .to.be.revertedWith("Contract is paused");
  });

  it("allows fetching comments with pagination", async function () {
    for (let i = 0; i < 5; i++) {
      await commentsContract.connect(user2).createComment(subjectAddress, `ar://comment${i}`, { value: price });
    }
    
    const comments = await commentsContract.fetchComments(true, subjectAddress, 1, 3);
    expect(comments.length).to.equal(3);
    expect(comments[0].url).to.equal("ar://comment1");
    expect(comments[2].url).to.equal("ar://comment3");
  });

  it("excludes deleted comments when fetching if specified", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await commentsContract.connect(user2).deleteComment(subjectAddress, 0);

    const commentsIncluded = await commentsContract.fetchComments(true, subjectAddress, 0, 2);
    expect(commentsIncluded.length).to.equal(2);

    const commentsExcluded = await commentsContract.fetchComments(false, subjectAddress, 0, 2);
    expect(commentsExcluded.length).to.equal(1);
    expect(commentsExcluded[0].url).to.equal("ar://comment1");
  });

  it("prevents non-mods from using mod functions", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).deleteComment(subjectAddress, 0);

    await expect(commentsContract.connect(user2).restoreComment(subjectAddress, 0))
      .to.be.revertedWith("Not a mod or owner");
    await expect(commentsContract.connect(user2).togglePaused())
      .to.be.revertedWith("Not a mod or owner");
  });

  it("allows owner to change mod token address and minimum balance", async function () {
    const newModToken = await (await ethers.getContractFactory("MockErc721")).deploy("NewModToken", "NMT");
    await newModToken.deployed();

    await commentsContract.connect(owner).setModTokenAddress(newModToken.address);
    expect(await commentsContract.modTokenAddress()).to.equal(newModToken.address);

    await commentsContract.connect(owner).setModMinBalance(2);
    expect(await commentsContract.modMinBalance()).to.equal(2);
  });

  it("allows mod to suspend and unsuspend a user", async function () {
    await commentsContract.connect(user1).suspendUser(user2.address);
    expect(await commentsContract.suspended(user2.address)).to.be.true;

    await commentsContract.connect(user1).unsuspendUser(user2.address);
    expect(await commentsContract.suspended(user2.address)).to.be.false;
  });

  it("prevents suspended users from creating comments", async function () {
    await commentsContract.connect(user1).suspendUser(user2.address);
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price }))
      .to.be.revertedWith("You are suspended from posting");

    await commentsContract.connect(user1).unsuspendUser(user2.address);
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await expect(tx).to.emit(commentsContract, "CommentPosted");
  });

  it("allows owner to withdraw revenue", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    
    const initialBalance = await ethers.provider.getBalance(user3.address);
    await commentsContract.connect(owner).withdrawRevenue(user3.address);
    const finalBalance = await ethers.provider.getBalance(user3.address);

    expect(finalBalance.sub(initialBalance)).to.equal(price);
  });

  it("prevents non-owner from withdrawing revenue", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await expect(commentsContract.connect(user1).withdrawRevenue(user1.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("allows owner to set a new price", async function () {
    const newPrice = ethers.utils.parseEther("0.0002");
    await commentsContract.connect(owner).setPrice(newPrice);
    expect(await commentsContract.price()).to.equal(newPrice);
  });

  it("prevents creating a comment with insufficient payment", async function () {
    const insufficientPrice = price.sub(1);
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: insufficientPrice }))
      .to.be.revertedWith("Payment is less than the price");
  });

  it("correctly identifies mods and non-mods", async function () {
    expect(await commentsContract.isUserMod(owner.address)).to.be.true;
    expect(await commentsContract.isUserMod(user1.address)).to.be.true;
    expect(await commentsContract.isUserMod(user2.address)).to.be.false;

    await modTokenContract.mint(user2.address);
    expect(await commentsContract.isUserMod(user2.address)).to.be.true;

    await commentsContract.connect(owner).setModMinBalance(2);
    expect(await commentsContract.isUserMod(user2.address)).to.be.false;

    await modTokenContract.mint(user2.address);
    expect(await commentsContract.isUserMod(user2.address)).to.be.true;
  });

  it("fetches the last N comments correctly", async function () {
    for (let i = 0; i < 5; i++) {
      await commentsContract.connect(user2).createComment(subjectAddress, `ar://comment${i}`, { value: price });
    }
    
    const comments = await commentsContract.fetchLastComments(true, subjectAddress, 3);
    expect(comments.length).to.equal(3);
    expect(comments[0].url).to.equal("ar://comment2");
    expect(comments[1].url).to.equal("ar://comment3");
    expect(comments[2].url).to.equal("ar://comment4");
  });

  it("handles case when requested length is larger than comments array", async function () {
    for (let i = 0; i < 3; i++) {
      await commentsContract.connect(user2).createComment(subjectAddress, `ar://comment${i}`, { value: price });
    }
    
    const comments = await commentsContract.fetchLastComments(true, subjectAddress, 5);
    expect(comments.length).to.equal(3);
    expect(comments[0].url).to.equal("ar://comment0");
    expect(comments[2].url).to.equal("ar://comment2");
  });

  it("returns empty array when there are no comments", async function () {
    const comments = await commentsContract.fetchLastComments(true, subjectAddress, 5);
    expect(comments.length).to.equal(0);
  });

  it("excludes deleted comments when specified in fetchLastComments", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment2", { value: price });
    await commentsContract.connect(user2).deleteComment(subjectAddress, 1);

    const commentsIncluded = await commentsContract.fetchLastComments(true, subjectAddress, 3);
    expect(commentsIncluded.length).to.equal(3);

    const commentsExcluded = await commentsContract.fetchLastComments(false, subjectAddress, 3);
    expect(commentsExcluded.length).to.equal(2);
    expect(commentsExcluded[0].url).to.equal("ar://comment0");
    expect(commentsExcluded[1].url).to.equal("ar://comment2");
  });

});
