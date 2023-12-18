// npx hardhat test test/keys/friendKeys.test.js

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

describe("FriendKeys", function () {
  let mockPunkTldContract;
  let statsMiddlewareContract;
  let friendKeysContract;

  let owner;
  let feeReceiver;
  let user1;
  let user2; // domain holder

  const domainName = "test"; // test.tld domain

  const protocolFeePercent = ethers.utils.parseEther("0.05");
  const domainHolderFeePercent = ethers.utils.parseEther("0.05");
  const ratio = ethers.utils.parseEther("133769"); // ETH for 16000 keys

  //const provider = waffle.provider;

  beforeEach(async function () {
    [owner, feeReceiver, user1, user2] = await ethers.getSigners();

    const MockPunkTld = await ethers.getContractFactory("MockPunkTld");
    mockPunkTldContract = await MockPunkTld.deploy(user2.address, domainName);
    await mockPunkTldContract.deployed();

    const Stats = await ethers.getContractFactory("Stats");
    const statsContract = await Stats.deploy();
    await statsContract.deployed();

    const StatsMiddleware = await ethers.getContractFactory("StatsMiddleware");
    statsMiddlewareContract = await StatsMiddleware.deploy(statsContract.address);
    await statsMiddlewareContract.deployed();

    await statsContract.setStatsWriterAddress(statsMiddlewareContract.address);

    const FriendKeys = await ethers.getContractFactory("FriendKeys");
    friendKeysContract = await FriendKeys.deploy(
      mockPunkTldContract.address, 
      feeReceiver.address, 
      statsMiddlewareContract.address, 
      protocolFeePercent, 
      domainHolderFeePercent, 
      ratio
    );
    await friendKeysContract.deployed();

    await statsMiddlewareContract.addWriter(friendKeysContract.address);
  });

  it("buys and sell 3 keys sequentially", async function () {
    // function getSellPriceAfterFee(string memory domainName, uint256 amount) public view returns (uint256)
    // get sell price for 1 domain
    const sellPrice = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice: " + ethers.utils.formatEther(sellPrice) + " ETH");

    // get domain holder address
    const domainHolderAddress = await mockPunkTldContract.getDomainHolder(domainName);
    expect(domainHolderAddress).to.equal(user2.address);

    // get domain holder balance
    const domainHolderBalanceBefore = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceBefore: " + ethers.utils.formatEther(domainHolderBalanceBefore) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceBefore = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceBefore: " + ethers.utils.formatEther(feeReceiverBalanceBefore) + " ETH");

    // get user1 balance
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceBefore: " + ethers.utils.formatEther(user1BalanceBefore) + " ETH");

    // get smart contract balance
    const smartContractBalanceBefore = await ethers.provider.getBalance(friendKeysContract.address);
    console.log("smartContractBalanceBefore: " + ethers.utils.formatEther(smartContractBalanceBefore) + " ETH");

    // get buy price (should be 0 for the 1 share)
    const buyPriceBefore = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceBefore: " + ethers.utils.formatEther(buyPriceBefore) + " ETH");
    //expect(buyPriceBefore).to.equal(ethers.utils.parseEther("0"));

    // buy 1 share
    const tx = await friendKeysContract.connect(user1).buyKeys(domainName, 1, { value: buyPriceBefore });
    const receipt = await tx.wait();
    //calculateGasCosts("buyKeys", receipt);

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter1 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter1: " + ethers.utils.formatEther(domainHolderBalanceAfter1) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter1 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter1: " + ethers.utils.formatEther(feeReceiverBalanceAfter1) + " ETH");

    // get user1 balance
    const user1BalanceAfter1 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter1: " + ethers.utils.formatEther(user1BalanceAfter1) + " ETH");

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter1 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter1: " + ethers.utils.formatEther(buyPriceAfter1) + " ETH");

    // get sell price for 1 domain
    const sellPriceBefore = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPriceBefore: " + ethers.utils.formatEther(sellPriceBefore) + " ETH");

    // buy 1 share
    const tx2 = await friendKeysContract.connect(user1).buyKeys(domainName, 1, { value: buyPriceAfter1 });
    const receipt2 = await tx2.wait();
    //calculateGasCosts("buyKeys", receipt2);

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter2 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter2: " + ethers.utils.formatEther(domainHolderBalanceAfter2) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter2 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter2: " + ethers.utils.formatEther(feeReceiverBalanceAfter2) + " ETH");

    // get user1 balance
    const user1BalanceAfter2 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter2: " + ethers.utils.formatEther(user1BalanceAfter2) + " ETH");

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter2 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter2: " + ethers.utils.formatEther(buyPriceAfter2) + " ETH");

    // buy 1 share
    const tx3 = await friendKeysContract.connect(user1).buyKeys(domainName, 1, { value: buyPriceAfter2 });
    const receipt3 = await tx3.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter3 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter3: " + ethers.utils.formatEther(domainHolderBalanceAfter3) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter3 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter3: " + ethers.utils.formatEther(feeReceiverBalanceAfter3) + " ETH");

    // get user1 balance
    const user1BalanceAfter3 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter3: " + ethers.utils.formatEther(user1BalanceAfter3) + " ETH");

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter3 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter3: " + ethers.utils.formatEther(buyPriceAfter3) + " ETH");

    // get sell price for 1 domain
    const sellPrice1 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice1: " + ethers.utils.formatEther(sellPrice1) + " ETH");

    // sell 1 share
    const tx4 = await friendKeysContract.connect(user1).sellKeys(domainName, 1);
    const receipt4 = await tx4.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter4 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter4: " + ethers.utils.formatEther(domainHolderBalanceAfter4) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter4 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter4: " + ethers.utils.formatEther(feeReceiverBalanceAfter4) + " ETH");

    // get user1 balance
    const user1BalanceAfter4 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter4: " + ethers.utils.formatEther(user1BalanceAfter4) + " ETH");

    // get sell price for 1 domain
    const sellPrice2 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice2: " + ethers.utils.formatEther(sellPrice2) + " ETH");

    // sell 1 share
    const tx5 = await friendKeysContract.connect(user1).sellKeys(domainName, 1);
    const receipt5 = await tx5.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter5 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter5: " + ethers.utils.formatEther(domainHolderBalanceAfter5) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter5 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter5: " + ethers.utils.formatEther(feeReceiverBalanceAfter5) + " ETH");

    // get user1 balance
    const user1BalanceAfter5 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter5: " + ethers.utils.formatEther(user1BalanceAfter5) + " ETH");

    // get sell price for 1 domain
    const sellPrice3 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice3: " + ethers.utils.formatEther(sellPrice3) + " ETH");

    // sell 1 share
    const tx6 = await friendKeysContract.connect(user1).sellKeys(domainName, 1);
    const receipt6 = await tx6.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter6 = await ethers.provider.getBalance(domainHolderAddress);
    console.log("domainHolderBalanceAfter6: " + ethers.utils.formatEther(domainHolderBalanceAfter6) + " ETH");

    // get fee receiver balance
    const feeReceiverBalanceAfter6 = await ethers.provider.getBalance(feeReceiver.address);
    console.log("feeReceiverBalanceAfter6: " + ethers.utils.formatEther(feeReceiverBalanceAfter6) + " ETH");

    // get user1 balance
    const user1BalanceAfter6 = await ethers.provider.getBalance(user1.address);
    console.log("user1BalanceAfter6: " + ethers.utils.formatEther(user1BalanceAfter6) + " ETH");

    // get sell price for 1 domain
    const sellPrice4 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice4: " + ethers.utils.formatEther(sellPrice4) + " ETH");

    // get smart contract balance
    const smartContractBalance4 = await ethers.provider.getBalance(friendKeysContract.address);
    console.log("smartContractBalance4: " + ethers.utils.formatEther(smartContractBalance4) + " ETH");

    // mapping(string => uint256) public keysSupply;
    // get key supply
    const keySupply = await friendKeysContract.keysSupply(domainName);
    console.log("keySupply: " + keySupply);

    // expect to revert when trying to sell the last share as user2
    await expect(friendKeysContract.connect(user2).sellKeys(domainName, 1)).to.be.revertedWith("Cannot sell the last key");
    
  });

});