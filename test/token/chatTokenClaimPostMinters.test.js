// npx hardhat test test/token/chatTokenClaimPostMinters.test.js

const { expect } = require("chai");

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

describe("ChatTokenClaimPostMinters", function () {
  let chatTokenContract;
  let chatTokenMinterContract;
  let iggyPostStatsContract;
  let chatTokenClaimPostMinters;

  let owner;
  let user1;
  let user2;
  let user3;

  const chatEthRatio = 1000;

  const user1mintedWei = ethers.utils.parseEther("1.337");
  const user2mintedWei = ethers.utils.parseEther("4.2069");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // deploy ChatToken
    const ChatToken = await ethers.getContractFactory("ChatToken");
    chatTokenContract = await ChatToken.deploy("Chat Token", "CHAT");
    await chatTokenContract.deployed();

    // deploy ChatTokenMinter
    const ChatTokenMinter = await ethers.getContractFactory("ChatTokenMinter");
    chatTokenMinterContract = await ChatTokenMinter.deploy(chatTokenContract.address);
    await chatTokenMinterContract.deployed();

    // add minter to ChatToken
    await chatTokenContract.setMinter(chatTokenMinterContract.address);

    // deploy IggyPostStats
    const IggyPostStats = await ethers.getContractFactory("IggyPostStats");
    iggyPostStatsContract = await IggyPostStats.deploy(owner.address); // set owner as minter
    await iggyPostStatsContract.deployed();

    // deploy ChatTokenClaimPostMinters
    const ChatTokenClaimPostMinters = await ethers.getContractFactory("ChatTokenClaimPostMinters");
    chatTokenClaimPostMinters = await ChatTokenClaimPostMinters.deploy(
      chatTokenMinterContract.address, // ChatTokenMinter address
      iggyPostStatsContract.address, // IggyPostStats address
      chatEthRatio // how many tokens per ETH spent will user get (1000 CHAT per ETH)
    );

    // add ChatTokenClaimPostMinters address as minter in ChatTokenMinter
    await chatTokenMinterContract.addMinter(chatTokenClaimPostMinters.address);

    // add some data in the stats contract (addMintedWei for user1 and user2)
    await iggyPostStatsContract.addMintedWei(user1.address, user1mintedWei);
    await iggyPostStatsContract.addMintedWei(user2.address, user2mintedWei);
  });
  
  it("can claim CHAT tokens based on data from the stats contract", async function () {
    // user1: check CHAT balance 1
    const user1ChatBalance1 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance1).to.equal(0);

    // user1: check claim preview 1
    const user1ClaimPreview1 = await chatTokenClaimPostMinters.claimPreview(user1.address);
    expect(user1ClaimPreview1).to.equal(user1mintedWei.mul(chatEthRatio));
    console.log("user1 claim preview: ", ethers.utils.formatEther(user1ClaimPreview1), " CHAT");

    // user1: claim CHAT tokens
    const user1ClaimTx = await chatTokenClaimPostMinters.connect(user1).claim();
    const receiptUser1ClaimTx = await user1ClaimTx.wait();
    calculateGasCosts("user1 claim", receiptUser1ClaimTx);

    // user1: check CHAT balance 2
    const user1ChatBalance2 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance2).to.equal(user1mintedWei.mul(chatEthRatio));

    // user1: check claim preview 2
    const user1ClaimPreview2 = await chatTokenClaimPostMinters.claimPreview(user1.address);
    expect(user1ClaimPreview2).to.equal(0);

    // user1: fail to claim CHAT tokens again
    await expect(chatTokenClaimPostMinters.connect(user1).claim()).to.be.revertedWith("ChatTokenClaimPostMinters: user already claimed");

    // user2: check CHAT balance 1
    const user2ChatBalance1 = await chatTokenContract.balanceOf(user2.address);
    expect(user2ChatBalance1).to.equal(0);

    // user2: check claim preview 1
    const user2ClaimPreview1 = await chatTokenClaimPostMinters.claimPreview(user2.address);
    expect(user2ClaimPreview1).to.equal(user2mintedWei.mul(chatEthRatio));
    console.log("user2 claim preview: ", ethers.utils.formatEther(user2ClaimPreview1), " CHAT");

    // user2: claim CHAT tokens
    const user2ClaimTx = await chatTokenClaimPostMinters.connect(user2).claim();
    const receiptUser2ClaimTx = await user2ClaimTx.wait();
    calculateGasCosts("user2 claim", receiptUser2ClaimTx);

    // user2: check CHAT balance 2
    const user2ChatBalance2 = await chatTokenContract.balanceOf(user2.address);
    expect(user2ChatBalance2).to.equal(user2mintedWei.mul(chatEthRatio));

    // user2: check claim preview 2
    const user2ClaimPreview2 = await chatTokenClaimPostMinters.claimPreview(user2.address);
    expect(user2ClaimPreview2).to.equal(0);

    // user2: fail to claim CHAT tokens again
    await expect(chatTokenClaimPostMinters.connect(user2).claim()).to.be.revertedWith("ChatTokenClaimPostMinters: user already claimed");

  });

});