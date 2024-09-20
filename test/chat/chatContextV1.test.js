// npx hardhat test test/chat/chatContextV1.test.js

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

describe("ChatContextV1", function () {
  let chatContract;
  let modTokenContract;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockErc721 = await ethers.getContractFactory("MockErc721");
    modTokenContract = await MockErc721.deploy("ModToken", "MT");
    await modTokenContract.deployed();

    const ChatContextV1 = await ethers.getContractFactory("ChatContextV1");
    chatContract = await ChatContextV1.deploy(modTokenContract.address, owner.address, 1);
    await chatContract.deployed();

    // mint mod token to user1
    await modTokenContract.mint(user1.address);
  });

  it("checks if state variables are set correctly", async function () {
    const modTokenAddress = await chatContract.modTokenAddress();
    expect(modTokenAddress).to.equal(modTokenContract.address);

    const modMinBalance = await chatContract.modMinBalance();
    expect(modMinBalance).to.equal(1);

    const ownerAddress = await chatContract.owner();
    expect(ownerAddress).to.equal(owner.address);
  });

  it("allows creating a main message", async function () {
    const tx = await chatContract.connect(user2).createMessage("ipfs://message1");
    await expect(tx).to.emit(chatContract, "MessagePosted")
      .withArgs(user2.address, "ipfs://message1", await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const message = await chatContract.getMainMessage(0);
    expect(message.author).to.equal(user2.address);
    expect(message.url).to.equal("ipfs://message1");
    expect(message.deleted).to.be.false;
    expect(message.index).to.equal(0); // Check the index field
  });

  it("allows creating a reply", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message1");

    // get replies count before
    const message1 = await chatContract.getMainMessage(0);
    expect(message1.repliesCount).to.equal(0);

    const tx = await chatContract.connect(user3).createReply(0, "ipfs://reply1");
    await expect(tx).to.emit(chatContract, "MessageReplied")
      .withArgs(user3.address, "ipfs://reply1", 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));

    // get replies count after
    const message2 = await chatContract.getMainMessage(0);
    expect(message2.repliesCount).to.equal(1);

    const reply = await chatContract.getReply(0, 0);
    expect(reply.author).to.equal(user3.address);
    expect(reply.url).to.equal("ipfs://reply1");
    expect(reply.deleted).to.be.false;
    expect(reply.index).to.equal(0); // Check the index field
  });

  it("allows author to delete their main message", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message1");
    const tx = await chatContract.connect(user2).deleteMessage(0);
    await expect(tx).to.emit(chatContract, "MainMessageDeleted")
      .withArgs(user2.address, "ipfs://message1", 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const message = await chatContract.getMainMessage(0);
    expect(message.deleted).to.be.true;
  });

  it("allows author to delete their reply", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message1");
    await chatContract.connect(user3).createReply(0, "ipfs://reply1");
    const tx = await chatContract.connect(user3).deleteReply(0, 0);
    await expect(tx).to.emit(chatContract, "ReplyDeleted")
      .withArgs(user3.address, "ipfs://reply1", 0, 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const reply = await chatContract.getReply(0, 0);
    expect(reply.deleted).to.be.true;
  });

  it("allows mod to restore a deleted main message", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message1");
    await chatContract.connect(user2).deleteMessage(0);
    const tx = await chatContract.connect(user1).restoreMessage(0);
    await expect(tx).to.emit(chatContract, "MainMessageRestored")
      .withArgs(user1.address, "ipfs://message1", 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const message = await chatContract.getMainMessage(0);
    expect(message.deleted).to.be.false;
  });

  it("allows mod to restore a deleted reply", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message1");
    await chatContract.connect(user3).createReply(0, "ipfs://reply1");
    await chatContract.connect(user3).deleteReply(0, 0);
    const tx = await chatContract.connect(user1).restoreReply(0, 0);
    await expect(tx).to.emit(chatContract, "ReplyRestored")
      .withArgs(user1.address, "ipfs://reply1", 0, 0, await ethers.provider.getBlock('latest').then(b => b.timestamp));
    
    const reply = await chatContract.getReply(0, 0);
    expect(reply.deleted).to.be.false;
  });

  it("allows mod to pause and unpause the contract", async function () {
    await chatContract.connect(user1).togglePaused();
    expect(await chatContract.paused()).to.be.true;

    await chatContract.connect(user1).togglePaused();
    expect(await chatContract.paused()).to.be.false;
  });

  it("prevents creating messages when paused", async function () {
    await chatContract.connect(user1).togglePaused();
    await expect(chatContract.connect(user2).createMessage("ipfs://message1"))
      .to.be.revertedWith("Contract is paused");
    await expect(chatContract.connect(user2).createReply(0, "ipfs://reply1"))
      .to.be.revertedWith("Contract is paused");
  });

  it("allows fetching main messages with pagination", async function () {
    for (let i = 0; i < 5; i++) {
      await chatContract.connect(user2).createMessage(`ipfs://message${i}`);
    }
    
    const messages = await chatContract.fetchMainMessages(true, 1, 3);
    expect(messages.length).to.equal(3);
    expect(messages[0].url).to.equal("ipfs://message1");
    expect(messages[2].url).to.equal("ipfs://message3");
  });

  it("allows fetching replies with pagination", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    for (let i = 0; i < 5; i++) {
      await chatContract.connect(user3).createReply(0, `ipfs://reply${i}`);
    }
    
    const replies = await chatContract.fetchReplies(true, 0, 1, 3);
    expect(replies.length).to.equal(3);
    expect(replies[0].url).to.equal("ipfs://reply1");
    expect(replies[2].url).to.equal("ipfs://reply3");
  });

  it("excludes deleted messages when fetching if specified", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user2).createMessage("ipfs://message1");
    await chatContract.connect(user2).deleteMessage(0);

    const messagesIncluded = await chatContract.fetchMainMessages(true, 0, 2);
    //console.log(messagesIncluded);
    expect(messagesIncluded.length).to.equal(2);

    const messagesExcluded = await chatContract.fetchMainMessages(false, 0, 2);
    //console.log(messagesExcluded);
    expect(messagesExcluded.length).to.equal(1);
    expect(messagesExcluded[0].url).to.equal("ipfs://message1");
  });

  it("prevents non-mods from using mod functions", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user2).deleteMessage(0);

    await expect(chatContract.connect(user2).restoreMessage(0))
      .to.be.revertedWith("Not a mod or owner");
    await expect(chatContract.connect(user2).togglePaused())
      .to.be.revertedWith("Not a mod or owner");
  });

  it("allows owner to change mod token address and minimum balance", async function () {
    const newModToken = await (await ethers.getContractFactory("MockErc721")).deploy("NewModToken", "NMT");
    await newModToken.deployed();

    await chatContract.connect(owner).setModTokenAddress(newModToken.address);
    expect(await chatContract.modTokenAddress()).to.equal(newModToken.address);

    await chatContract.connect(owner).setModMinBalance(2);
    expect(await chatContract.modMinBalance()).to.equal(2);

    // prevent non-owner from changing mod token address and minimum balance
    await expect(chatContract.connect(user1).setModTokenAddress(newModToken.address))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(chatContract.connect(user1).setModMinBalance(2))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("prevents creating messages with empty URLs", async function () {
    await expect(chatContract.connect(user2).createMessage(""))
      .to.be.revertedWith("URL cannot be empty");
    await expect(chatContract.connect(user2).createReply(0, ""))
      .to.be.revertedWith("URL cannot be empty");
  });

  it("correctly handles message and reply counts", async function () {
    expect(await chatContract.getMainMessageCount()).to.equal(0);
    await chatContract.connect(user2).createMessage("ipfs://message0");
    expect(await chatContract.getMainMessageCount()).to.equal(1);

    expect(await chatContract.getReplyCount(0)).to.equal(0);
    await chatContract.connect(user3).createReply(0, "ipfs://reply0");
    expect(await chatContract.getReplyCount(0)).to.equal(1);
  });

  it("allows mod to suspend and unsuspend a user", async function () {
    // Suspend user2
    await chatContract.connect(user1).suspendUser(user2.address);
    expect(await chatContract.suspended(user2.address)).to.be.true;

    // Unsuspend user2
    await chatContract.connect(user1).unsuspendUser(user2.address);
    expect(await chatContract.suspended(user2.address)).to.be.false;

    // non-mod cannot suspend or unsuspend
    await expect(chatContract.connect(user2).suspendUser(user3.address))
      .to.be.revertedWith("Not a mod or owner");
    await expect(chatContract.connect(user2).unsuspendUser(user3.address))
      .to.be.revertedWith("Not a mod or owner");
  });

  it("prevents suspended users from creating messages", async function () {
    // Suspend user2
    await chatContract.connect(user1).suspendUser(user2.address);
    expect(await chatContract.suspended(user2.address)).to.be.true;

    // Attempt to create a message
    await expect(chatContract.connect(user2).createMessage("ipfs://message1"))
      .to.be.revertedWith("You are suspended from posting");

    // Unsuspend user2
    await chatContract.connect(user1).unsuspendUser(user2.address);
    expect(await chatContract.suspended(user2.address)).to.be.false;

    // Attempt to create a message again
    const tx = await chatContract.connect(user2).createMessage("ipfs://message1");
    await expect(tx).to.emit(chatContract, "MessagePosted")
      .withArgs(user2.address, "ipfs://message1", await ethers.provider.getBlock('latest').then(b => b.timestamp));
  });

  it("handles pagination correctly when there are no messages", async function () {
    const messages = await chatContract.fetchMainMessages(true, 0, 10);
    expect(messages.length).to.equal(0);
  });

  it("handles pagination correctly when requesting more messages than available", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user2).createMessage("ipfs://message1");

    const messages = await chatContract.fetchMainMessages(true, 0, 5);
    expect(messages.length).to.equal(2);
  });

  it("prevents deleting a non-existent message", async function () {
    await expect(chatContract.connect(user2).deleteMessage(0))
      .to.be.reverted;
  });

  it("prevents restoring a non-deleted message", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await expect(chatContract.connect(user1).restoreMessage(0))
      .to.be.revertedWith("Message is not deleted");
  });

  it("allows owner to delete any message", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    const tx = await chatContract.connect(owner).deleteMessage(0);
    await expect(tx).to.emit(chatContract, "MainMessageDeleted");
  });

  it("handles multiple main messages and replies correctly", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user2).createMessage("ipfs://message1");
    await chatContract.connect(user3).createReply(0, "ipfs://reply0");
    await chatContract.connect(user3).createReply(1, "ipfs://reply1");

    expect(await chatContract.getMainMessageCount()).to.equal(2);
    expect(await chatContract.getReplyCount(0)).to.equal(1);
    expect(await chatContract.getReplyCount(1)).to.equal(1);

    const messages = await chatContract.fetchMainMessages(true, 0, 10);
    expect(messages.length).to.equal(2);
    expect(messages[0].url).to.equal("ipfs://message0");
    expect(messages[0].index).to.equal(0); // Check the index field
    expect(messages[1].url).to.equal("ipfs://message1");
    expect(messages[1].index).to.equal(1); // Check the index field

    const replies0 = await chatContract.fetchReplies(true, 0, 0, 10);
    const replies1 = await chatContract.fetchReplies(true, 1, 0, 10);

    expect(replies0.length).to.equal(1);
    expect(replies1.length).to.equal(1);
    expect(replies0[0].url).to.equal("ipfs://reply0");
    expect(replies0[0].index).to.equal(0); // Check the index field
    expect(replies1[0].url).to.equal("ipfs://reply1");
    expect(replies1[0].index).to.equal(0); // Check the index field
  });

  it("prevents creating a reply to a non-existent main message", async function () {
    await expect(chatContract.connect(user3).createReply(0, "ipfs://reply0"))
      .to.be.reverted;
  });

  it("prevents deleting a non-existent reply", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await expect(chatContract.connect(user3).deleteReply(0, 0))
      .to.be.reverted;
  });

  it("prevents restoring a non-deleted reply", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user3).createReply(0, "ipfs://reply0");
    await expect(chatContract.connect(user1).restoreReply(0, 0))
      .to.be.revertedWith("Reply is not deleted");
  });

  it("handles suspension and unsuspension for replies", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user1).suspendUser(user3.address);
    
    await expect(chatContract.connect(user3).createReply(0, "ipfs://reply0"))
      .to.be.revertedWith("You are suspended from posting");

    await chatContract.connect(user1).unsuspendUser(user3.address);
    const tx = await chatContract.connect(user3).createReply(0, "ipfs://reply0");
    await expect(tx).to.emit(chatContract, "MessageReplied");
  });

  it("allows fetching last main messages", async function () {
    for (let i = 0; i < 5; i++) {
      await chatContract.connect(user2).createMessage(`ipfs://message${i}`);
    }
    
    const messages = await chatContract.fetchLastMainMessages(false, 3);
    expect(messages.length).to.equal(3);
    expect(messages[0].url).to.equal("ipfs://message2");
    expect(messages[1].url).to.equal("ipfs://message3");
    expect(messages[2].url).to.equal("ipfs://message4");
  });

  it("handles fetchLastMainMessages when requesting more messages than available", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user2).createMessage("ipfs://message1");

    const messages = await chatContract.fetchLastMainMessages(false, 5);
    expect(messages.length).to.equal(2);
    expect(messages[0].url).to.equal("ipfs://message0");
    expect(messages[1].url).to.equal("ipfs://message1");
  });

  it("handles fetchLastMainMessages with zero messages", async function () {
    const messages = await chatContract.fetchLastMainMessages(false, 3);
    expect(messages.length).to.equal(0);
  });

  it("allows fetching last replies", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    for (let i = 0; i < 5; i++) {
      await chatContract.connect(user3).createReply(0, `ipfs://reply${i}`);
    }
    
    const replies = await chatContract.fetchLastReplies(false, 0, 3);
    expect(replies.length).to.equal(3);
    expect(replies[0].url).to.equal("ipfs://reply2");
    expect(replies[1].url).to.equal("ipfs://reply3");
    expect(replies[2].url).to.equal("ipfs://reply4");
  });

  it("handles fetchLastReplies when requesting more replies than available", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    await chatContract.connect(user3).createReply(0, "ipfs://reply0");
    await chatContract.connect(user3).createReply(0, "ipfs://reply1");

    const replies = await chatContract.fetchLastReplies(false, 0, 5);
    expect(replies.length).to.equal(2);
    expect(replies[0].url).to.equal("ipfs://reply0");
    expect(replies[1].url).to.equal("ipfs://reply1");
  });

  it("handles fetchLastReplies with zero replies", async function () {
    await chatContract.connect(user2).createMessage("ipfs://message0");
    const replies = await chatContract.fetchLastReplies(false, 0, 3);
    expect(replies.length).to.equal(0);
  });

  it("handles fetchLastReplies for a non-existent main message", async function () {
    const result = await chatContract.fetchLastReplies(false, 999, 3)
    expect(result).to.be.empty;
  });

});