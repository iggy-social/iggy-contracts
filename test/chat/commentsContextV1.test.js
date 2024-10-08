// npx hardhat test test/chat/commentsContextV1.test.js

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

describe("CommentsContextV1", function () {
  let commentsContract;
  let modTokenContract;
  let owner, user1, user2, user3;
  let subjectAddress;
  const price = ethers.utils.parseEther("0.00001");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    subjectAddress = ethers.Wallet.createRandom().address;

    const MockErc721 = await ethers.getContractFactory("MockErc721");
    modTokenContract = await MockErc721.deploy("ModToken", "MT");
    await modTokenContract.deployed();

    const CommentsContextV1 = await ethers.getContractFactory("CommentsContextV1");
    commentsContract = await CommentsContextV1.deploy(modTokenContract.address, owner.address, 1);
    await commentsContract.deployed();

    // mint mod token to user1
    await modTokenContract.mint(user1.address);
  });

  it("checks if state variables are set correctly", async function () {
    const modTokenAddress = await commentsContract.modTokenAddress();
    expect(modTokenAddress).to.equal(modTokenContract.address);

    const modMinBalance = await commentsContract.modMinBalance();
    expect(modMinBalance).to.equal(1);

    const ownerAddress = await commentsContract.owner();
    expect(ownerAddress).to.equal(owner.address);
  });

  it("allows creating a comment and sets the index correctly", async function () {
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await expect(tx).to.emit(commentsContract, "CommentPosted")
      .withArgs(user2.address, "ar://comment1", subjectAddress, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const comment = await commentsContract.getComment(subjectAddress, 0);
    expect(comment.author).to.equal(user2.address);
    expect(comment.url).to.equal("ar://comment1");
    expect(comment.deleted).to.be.false;
    expect(comment.index).to.equal(0);  // Check that the index is set correctly
  });

  it("sets correct indices for multiple comments", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment2", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment3", { value: price });

    const comment1 = await commentsContract.getComment(subjectAddress, 0);
    const comment2 = await commentsContract.getComment(subjectAddress, 1);
    const comment3 = await commentsContract.getComment(subjectAddress, 2);

    expect(comment1.index).to.equal(0);
    expect(comment2.index).to.equal(1);
    expect(comment3.index).to.equal(2);
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

  it("correctly sets indices when fetching comments with pagination", async function () {
    for (let i = 0; i < 5; i++) {
      await commentsContract.connect(user2).createComment(subjectAddress, `ar://comment${i}`, { value: price });
    }
    
    const comments = await commentsContract.fetchComments(true, subjectAddress, 1, 3);
    expect(comments.length).to.equal(3);
    expect(comments[0].url).to.equal("ar://comment1");
    expect(comments[0].index).to.equal(1);
    expect(comments[1].url).to.equal("ar://comment2");
    expect(comments[1].index).to.equal(2);
    expect(comments[2].url).to.equal("ar://comment3");
    expect(comments[2].index).to.equal(3);
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

  it("prevents creating comments with empty URLs", async function () {
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "", { value: price }))
      .to.be.revertedWith("URL cannot be empty");
  });

  it("correctly handles comment counts", async function () {
    expect(await commentsContract.getCommentCount(subjectAddress)).to.equal(0);
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    expect(await commentsContract.getCommentCount(subjectAddress)).to.equal(1);
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

  it("handles pagination correctly when there are no comments", async function () {
    const comments = await commentsContract.fetchComments(true, subjectAddress, 0, 10);
    expect(comments.length).to.equal(0);
  });

  it("handles pagination correctly when requesting more comments than available", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });

    const comments = await commentsContract.fetchComments(true, subjectAddress, 0, 5);
    expect(comments.length).to.equal(2);
  });

  it("prevents deleting a non-existent comment", async function () {
    await expect(commentsContract.connect(user2).deleteComment(subjectAddress, 0))
      .to.be.reverted;
  });

  it("prevents restoring a non-deleted comment", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await expect(commentsContract.connect(user1).restoreComment(subjectAddress, 0))
      .to.be.revertedWith("Comment is not deleted");
  });

  it("allows owner to delete any comment", async function () {
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    const tx = await commentsContract.connect(owner).deleteComment(subjectAddress, 0);
    await expect(tx).to.emit(commentsContract, "CommentDeleted");
  });

  it("prevents non-owner from changing mod token address and minimum balance", async function () {
    await expect(commentsContract.connect(user1).setModTokenAddress(ethers.constants.AddressZero))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(commentsContract.connect(user1).setModMinBalance(2))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("handles multiple subject addresses correctly", async function () {
    const subjectAddress2 = ethers.Wallet.createRandom().address;

    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress2, "ar://comment1", { value: price });

    expect(await commentsContract.getCommentCount(subjectAddress)).to.equal(1);
    expect(await commentsContract.getCommentCount(subjectAddress2)).to.equal(1);

    const comments1 = await commentsContract.fetchComments(true, subjectAddress, 0, 10);
    const comments2 = await commentsContract.fetchComments(true, subjectAddress2, 0, 10);

    expect(comments1.length).to.equal(1);
    expect(comments2.length).to.equal(1);
    expect(comments1[0].url).to.equal("ar://comment0");
    expect(comments2[0].url).to.equal("ar://comment1");
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

  it("excludes deleted comments when specified", async function () {
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

  it("handles multiple subject addresses correctly", async function () {
    const subjectAddress2 = ethers.Wallet.createRandom().address;

    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment0", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await commentsContract.connect(user2).createComment(subjectAddress2, "ar://comment2", { value: price });

    const comments1 = await commentsContract.fetchLastComments(true, subjectAddress, 2);
    const comments2 = await commentsContract.fetchLastComments(true, subjectAddress2, 2);

    expect(comments1.length).to.equal(2);
    expect(comments2.length).to.equal(1);
    expect(comments1[0].url).to.equal("ar://comment0");
    expect(comments1[1].url).to.equal("ar://comment1");
    expect(comments2[0].url).to.equal("ar://comment2");
  });

  it("allows creating a comment with correct payment", async function () {
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price });
    await expect(tx).to.emit(commentsContract, "CommentPosted")
      .withArgs(user2.address, "ar://comment1", subjectAddress, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const comment = await commentsContract.getComment(subjectAddress, 0);
    expect(comment.author).to.equal(user2.address);
    expect(comment.url).to.equal("ar://comment1");
    expect(comment.deleted).to.be.false;
    expect(comment.index).to.equal(0);
  });

  it("prevents creating a comment with insufficient payment", async function () {
    const insufficientPrice = price.sub(1);
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: insufficientPrice }))
      .to.be.revertedWith("Payment is less than the price");
  });

  it("allows creating a comment with overpayment", async function () {
    const overpayment = price.add(ethers.utils.parseEther("0.0001"));
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: overpayment });
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

  it("prevents non-owner from setting a new price", async function () {
    const newPrice = ethers.utils.parseEther("0.0002");
    await expect(commentsContract.connect(user1).setPrice(newPrice))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("allows creating a comment with new price after price change", async function () {
    const newPrice = ethers.utils.parseEther("0.0002");
    await commentsContract.connect(owner).setPrice(newPrice);
    
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: newPrice });
    await expect(tx).to.emit(commentsContract, "CommentPosted");
  });

  it("prevents creating a comment with old price after price change", async function () {
    const newPrice = ethers.utils.parseEther("0.0002");
    await commentsContract.connect(owner).setPrice(newPrice);
    
    await expect(commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1", { value: price }))
      .to.be.revertedWith("Payment is less than the price");
  });

  it("allows creating a comment with price of 0 if set by owner", async function () {
    await commentsContract.connect(owner).setPrice(0);
    const tx = await commentsContract.connect(user2).createComment(subjectAddress, "ar://comment1");
    await expect(tx).to.emit(commentsContract, "CommentPosted");
  });

  it("handles withdrawing revenue when contract balance is 0", async function () {
    const initialBalance = await ethers.provider.getBalance(user3.address);
    await commentsContract.connect(owner).withdrawRevenue(user3.address);
    const finalBalance = await ethers.provider.getBalance(user3.address);

    expect(finalBalance).to.equal(initialBalance);
  });

  it("allows setting price to max uint256", async function () {
    const maxPrice = ethers.constants.MaxUint256;
    await commentsContract.connect(owner).setPrice(maxPrice);
    expect(await commentsContract.price()).to.equal(maxPrice);
  });

  it("correctly identifies mods and non-mods", async function () {
    // Check if owner is considered a mod
    expect(await commentsContract.isUserMod(owner.address)).to.be.true;

    // Check if user1 (who has a mod token) is considered a mod
    expect(await commentsContract.isUserMod(user1.address)).to.be.true;

    // Check if user2 (who doesn't have a mod token) is not considered a mod
    expect(await commentsContract.isUserMod(user2.address)).to.be.false;

    // Mint a mod token to user2 and check again
    await modTokenContract.mint(user2.address);
    expect(await commentsContract.isUserMod(user2.address)).to.be.true;

    // Change the minimum balance required to be a mod
    await commentsContract.connect(owner).setModMinBalance(2);

    // Check if user2 (who now has 1 token) is no longer considered a mod
    expect(await commentsContract.isUserMod(user2.address)).to.be.false;

    // Mint another token to user2 and check again
    await modTokenContract.mint(user2.address);
    expect(await commentsContract.isUserMod(user2.address)).to.be.true;
  });

});