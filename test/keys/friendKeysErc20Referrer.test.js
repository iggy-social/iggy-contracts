// npx hardhat test test/keys/friendKeysErc20Referrer.test.js

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

describe("FriendKeys ERC-20 with referrer", function () {
  let mockPunkTldContract;
  let statsMiddlewareContract;
  let friendKeysContract;

  let tokenContract; // ERC-20 token for buying/selling keys
  const tokenSymbol = "TTK";

  let owner;
  let feeReceiver;
  let user1;
  let user2; // domain holder
  let referrer;

  const domainName = "test"; // test.tld domain

  const protocolFeePercent = ethers.utils.parseEther("0.05");
  const domainHolderFeePercent = ethers.utils.parseEther("0.05");
  const ratio = ethers.utils.parseEther("133769"); // ETH for 16000 keys

  //const provider = waffle.provider;

  beforeEach(async function () {
    [owner, feeReceiver, user1, user2, referrer] = await ethers.getSigners();

    const MockErc20TokenDecimals = await ethers.getContractFactory("MockErc20TokenDecimals");
    tokenContract = await MockErc20TokenDecimals.deploy("Test token", tokenSymbol, 18);
    await tokenContract.deployed();

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

    const FriendKeys = await ethers.getContractFactory("FriendKeysErc20");
    friendKeysContract = await FriendKeys.deploy(
      mockPunkTldContract.address, 
      tokenContract.address, 
      feeReceiver.address, 
      statsMiddlewareContract.address, 
      protocolFeePercent, 
      domainHolderFeePercent, 
      ratio
    );
    await friendKeysContract.deployed();

    await statsMiddlewareContract.addWriter(friendKeysContract.address);

    // mint tokens for user1
    await tokenContract.mint(user1.address, ethers.utils.parseEther("1000"));
  });

  it("buys and sell 3 keys sequentially (with ERC-20 token and referrer)", async function () {
    // function getSellPriceAfterFee(string memory domainName, uint256 amount) public view returns (uint256)
    // get sell price for 1 domain
    const sellPrice = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice: " + ethers.utils.formatEther(sellPrice) + " " + tokenSymbol);

    // get domain holder address
    const domainHolderAddress = await mockPunkTldContract.getDomainHolder(domainName);
    expect(domainHolderAddress).to.equal(user2.address);

    // get domain holder token balance
    const domainHolderBalanceBefore = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceBefore: " + ethers.utils.formatEther(domainHolderBalanceBefore) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceBefore = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceBefore: " + ethers.utils.formatEther(feeReceiverBalanceBefore) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceBefore = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceBefore: " + ethers.utils.formatEther(user1BalanceBefore) + " " + tokenSymbol);

    // get smart contract balance
    const smartContractBalanceBefore = await tokenContract.balanceOf(friendKeysContract.address);
    console.log("smartContractBalanceBefore: " + ethers.utils.formatEther(smartContractBalanceBefore) + " " + tokenSymbol);

    // get referrer balance
    const referrerBalanceBefore = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceBefore: " + ethers.utils.formatEther(referrerBalanceBefore) + " " + tokenSymbol);

    // get buy price (should be 0 for the 1 share)
    const buyPriceBefore = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceBefore: " + ethers.utils.formatEther(buyPriceBefore) + " " + tokenSymbol);
    //expect(buyPriceBefore).to.equal(ethers.utils.parseEther("0"));

    // user1 gives token approval to friend keys smart contract
    await tokenContract.connect(user1).approve(
      friendKeysContract.address, 
      ethers.constants.MaxUint256 // max approval
    );

    // buy 1 share
    const tx = await friendKeysContract.connect(user1).buyKeys(
      domainName, 
      1, // keys amount
      referrer.address // referrer
    );
    const receipt = await tx.wait();
    //calculateGasCosts("buyKeys", receipt);

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter1 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter1: " + ethers.utils.formatEther(domainHolderBalanceAfter1) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter1 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter1: " + ethers.utils.formatEther(feeReceiverBalanceAfter1) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter1 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter1: " + ethers.utils.formatEther(user1BalanceAfter1) + " " + tokenSymbol);

    // get referrer balance after1
    const referrerBalanceAfter1 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter1: " + ethers.utils.formatEther(referrerBalanceAfter1) + " " + tokenSymbol);

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter1 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter1: " + ethers.utils.formatEther(buyPriceAfter1) + " " + tokenSymbol);

    // get sell price for 1 domain
    const sellPriceBefore = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPriceBefore: " + ethers.utils.formatEther(sellPriceBefore) + " " + tokenSymbol);

    // buy 1 share
    const tx2 = await friendKeysContract.connect(user1).buyKeys(domainName, 1, referrer.address);
    const receipt2 = await tx2.wait();
    //calculateGasCosts("buyKeys", receipt2);

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter2 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter2: " + ethers.utils.formatEther(domainHolderBalanceAfter2) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter2 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter2: " + ethers.utils.formatEther(feeReceiverBalanceAfter2) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter2 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter2: " + ethers.utils.formatEther(user1BalanceAfter2) + " " + tokenSymbol);

    // get referrer balance after2
    const referrerBalanceAfter2 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter2: " + ethers.utils.formatEther(referrerBalanceAfter2) + " " + tokenSymbol);

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter2 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter2: " + ethers.utils.formatEther(buyPriceAfter2) + " " + tokenSymbol);

    // buy 1 share
    const tx3 = await friendKeysContract.connect(user1).buyKeys(domainName, 1, referrer.address);
    const receipt3 = await tx3.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter3 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter3: " + ethers.utils.formatEther(domainHolderBalanceAfter3) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter3 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter3: " + ethers.utils.formatEther(feeReceiverBalanceAfter3) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter3 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter3: " + ethers.utils.formatEther(user1BalanceAfter3) + " " + tokenSymbol);

    // get referrer balance after3
    const referrerBalanceAfter3 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter3: " + ethers.utils.formatEther(referrerBalanceAfter3) + " " + tokenSymbol);

    // get buy price after (should not be 0 anymore)
    const buyPriceAfter3 = await friendKeysContract.getBuyPriceAfterFee(domainName, 1);
    console.log("buyPriceAfter3: " + ethers.utils.formatEther(buyPriceAfter3) + " " + tokenSymbol);

    // get sell price for 1 domain
    const sellPrice1 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice1: " + ethers.utils.formatEther(sellPrice1) + " " + tokenSymbol);

    // sell 1 share
    const tx4 = await friendKeysContract.connect(user1).sellKeys(domainName, 1, referrer.address);
    const receipt4 = await tx4.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter4 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter4: " + ethers.utils.formatEther(domainHolderBalanceAfter4) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter4 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter4: " + ethers.utils.formatEther(feeReceiverBalanceAfter4) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter4 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter4: " + ethers.utils.formatEther(user1BalanceAfter4) + " " + tokenSymbol);

    // get referrer balance after4
    const referrerBalanceAfter4 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter4: " + ethers.utils.formatEther(referrerBalanceAfter4) + " " + tokenSymbol);

    // get sell price for 1 domain
    const sellPrice2 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice2: " + ethers.utils.formatEther(sellPrice2) + " " + tokenSymbol);

    // sell 1 share
    const tx5 = await friendKeysContract.connect(user1).sellKeys(domainName, 1, referrer.address);
    const receipt5 = await tx5.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter5 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter5: " + ethers.utils.formatEther(domainHolderBalanceAfter5) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter5 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter5: " + ethers.utils.formatEther(feeReceiverBalanceAfter5) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter5 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter5: " + ethers.utils.formatEther(user1BalanceAfter5) + " " + tokenSymbol);

    // get referrer balance after5
    const referrerBalanceAfter5 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter5: " + ethers.utils.formatEther(referrerBalanceAfter5) + " " + tokenSymbol);

    // get sell price for 1 domain
    const sellPrice3 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice3: " + ethers.utils.formatEther(sellPrice3) + " " + tokenSymbol);

    // sell 1 share
    const tx6 = await friendKeysContract.connect(user1).sellKeys(domainName, 1, referrer.address);
    const receipt6 = await tx6.wait();

    console.log("----");

    // get domain holder balance
    const domainHolderBalanceAfter6 = await tokenContract.balanceOf(domainHolderAddress);
    console.log("domainHolderBalanceAfter6: " + ethers.utils.formatEther(domainHolderBalanceAfter6) + " " + tokenSymbol);

    // get fee receiver balance
    const feeReceiverBalanceAfter6 = await tokenContract.balanceOf(feeReceiver.address);
    console.log("feeReceiverBalanceAfter6: " + ethers.utils.formatEther(feeReceiverBalanceAfter6) + " " + tokenSymbol);

    // get user1 balance
    const user1BalanceAfter6 = await tokenContract.balanceOf(user1.address);
    console.log("user1BalanceAfter6: " + ethers.utils.formatEther(user1BalanceAfter6) + " " + tokenSymbol);

    // get referrer balance after6
    const referrerBalanceAfter6 = await tokenContract.balanceOf(referrer.address);
    console.log("referrerBalanceAfter6: " + ethers.utils.formatEther(referrerBalanceAfter6) + " " + tokenSymbol);

    // get sell price for 1 domain
    const sellPrice4 = await friendKeysContract.getSellPriceAfterFee(domainName, 1);
    console.log("sellPrice4: " + ethers.utils.formatEther(sellPrice4) + " " + tokenSymbol);

    // get smart contract balance
    const smartContractBalance4 = await tokenContract.balanceOf(friendKeysContract.address);
    console.log("smartContractBalance4: " + ethers.utils.formatEther(smartContractBalance4) + " " + tokenSymbol);

    // mapping(string => uint256) public keysSupply;
    // get key supply
    const keySupply = await friendKeysContract.keysSupply(domainName);
    console.log("keySupply: " + keySupply);

    // expect to revert when trying to sell the last share as user2
    await expect(friendKeysContract.connect(user2).sellKeys(domainName, 1, referrer.address)).to.be.revertedWith("Cannot sell the last key");
    
  });

});