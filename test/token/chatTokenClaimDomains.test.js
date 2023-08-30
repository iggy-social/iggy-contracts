// npx hardhat test test/token/chatTokenClaimDomains.test.js

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

describe("ChatTokenClaimDomains", function () {
  let chatTokenContract;
  let chatTokenMinterContract;
  let mockPunkTldContract;
  let chatTokenClaimDomainsContract;

  let owner;
  let user1;
  let user2;
  let user3;

  const domain1 = "user1a";
  const domain2 = "user1b";
  const domain3 = "user2a";
  const domain4 = "user2b";

  const chatReward = ethers.utils.parseEther("1337");

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

    // deploy MockPunkTld
    const MockPunkTld = await ethers.getContractFactory("MockPunkTld");
    mockPunkTldContract = await MockPunkTld.deploy(user3.address, "user3");
    await mockPunkTldContract.deployed();

    // deploy ChatTokenClaimDomains
    const ChatTokenClaimDomains = await ethers.getContractFactory("ChatTokenClaimDomains");
    chatTokenClaimDomainsContract = await ChatTokenClaimDomains.deploy(
      chatTokenMinterContract.address, // ChatTokenMinter address
      mockPunkTldContract.address, // TLD address
      chatReward, // chat rewards per domain
      100 // max domain NFT ID eligible for airdrop (aka snapshot)
    );

    // add ChatTokenClaimDomains address as minter in ChatTokenMinter
    await chatTokenMinterContract.addMinter(chatTokenClaimDomainsContract.address);

    // register some domains
    await mockPunkTldContract.register(domain1, user1.address);
    await mockPunkTldContract.register(domain2, user1.address);
    await mockPunkTldContract.register(domain3, user2.address);
    await mockPunkTldContract.register(domain4, user2.address);
  });
  
  it("can claim CHAT airdrop for a domain", async function () {
    // user1: check CHAT balance 1
    const user1ChatBalance1 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance1).to.equal(0);

    const tx = await chatTokenClaimDomainsContract.connect(user1).claim(domain1);
    const receipt = await tx.wait();
    calculateGasCosts("claimDomain user1a", receipt);

    // user1: check CHAT balance 2
    const user1ChatBalance2 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance2).to.equal(chatReward);

    // fail to claim the same domain again
    await expect(chatTokenClaimDomainsContract.connect(user1).claim(domain1)).to.be.revertedWith(
      "ChatTokenClaimDomains: domain already claimed"
    );

    // fail to claim non-existing domain
    await expect(chatTokenClaimDomainsContract.connect(user1).claim("non-existing")).to.be.revertedWith(
      "ChatTokenClaimDomains: domain not registered"
    );

    // user1: claim another domain
    await chatTokenClaimDomainsContract.connect(user1).claim(domain2);

    // user1: check CHAT balance 3
    const user1ChatBalance3 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance3).to.equal(chatReward.mul(2));

    // user2: check CHAT balance 1
    const user2ChatBalance1 = await chatTokenContract.balanceOf(user2.address);
    expect(user2ChatBalance1).to.equal(0);

    // user2: claim domain
    await chatTokenClaimDomainsContract.connect(user2).claim(domain3);

    // user2: check CHAT balance 2
    const user2ChatBalance2 = await chatTokenContract.balanceOf(user2.address);
    expect(user2ChatBalance2).to.equal(chatReward);

    // user1: claim for user2
    await chatTokenClaimDomainsContract.connect(user1).claim(domain4);

    // user2: check CHAT balance 3
    const user2ChatBalance3 = await chatTokenContract.balanceOf(user2.address);
    expect(user2ChatBalance3).to.equal(chatReward.mul(2));

    // user1: check CHAT balance 4
    const user1ChatBalance4 = await chatTokenContract.balanceOf(user1.address);
    expect(user1ChatBalance4).to.equal(user1ChatBalance3); // unchanged
  });


});