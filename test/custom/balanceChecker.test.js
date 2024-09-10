// create tests for the BalanceChecker contract
// npx hardhat test test/custom/balanceChecker.test.js

const { expect } = require("chai");

describe("Balance Checker", function () {
  let balanceCheckerContract;
  let tokenContract;

  let owner;
  let user1;
  let user2;
  let user3;

  beforeEach(async function () {
    [ owner, user1, user2, user3 ] = await ethers.getSigners();

    const MockErc20TokenDecimals = await ethers.getContractFactory("MockErc20TokenDecimals");
    tokenContract = await MockErc20TokenDecimals.deploy("Test token", "TEST", 18);
    await tokenContract.deployed();

    const BalanceChecker = await ethers.getContractFactory("BalanceChecker");
    balanceCheckerContract = await BalanceChecker.deploy(tokenContract.address);
    await balanceCheckerContract.deployed();

    // mint some tokens to the users
    await tokenContract.mint(user1.address, 500);
    await tokenContract.mint(user2.address, 250);
    await tokenContract.mint(user3.address, 1000);
  });

  it("shows balances for users", async function () {
    // 24455 gas
    console.log("Calling function getBalances...")
    const balances = await balanceCheckerContract.getBalances([user1.address, user2.address, user3.address]);
    console.log("balances:", balances);
    expect(balances[0]).to.equal(500);
    expect(balances[1]).to.equal(250);
    expect(balances[2]).to.equal(1000);

    // calculate gas costs
  });

  it("shows balances for users with addresses", async function () {
    // 27192 gas
    console.log("Calling function getBalancesWithAddresses...")
    const balances = await balanceCheckerContract.getBalancesWithAddresses([user1.address, user2.address, user3.address]);
    console.log("balances:", balances);
    expect(balances[1][0]).to.equal(500);
    expect(balances[1][1]).to.equal(250);
    expect(balances[1][2]).to.equal(1000);
  });

  it("shows balances for users with addresses tuples", async function () {
    // 26697 gas
    console.log("Calling function getBalancesWithAddressesTuples...")
    const balances = await balanceCheckerContract.getBalancesWithAddressesTuples([user1.address, user2.address, user3.address]);
    console.log("balances:", balances);
    expect(balances[0].balance).to.equal(500);
    expect(balances[0].account).to.equal(user1.address);
    expect(balances[1].balance).to.equal(250);
    expect(balances[1].account).to.equal(user2.address);
    expect(balances[2].balance).to.equal(1000);
    expect(balances[2].account).to.equal(user3.address);
  });

  it("shows address with highest balance", async function () {
    // 23803 gas
    console.log("Calling function getAddressWithHighestBalance...")
    const addressWithHighestBalance = await balanceCheckerContract.getAddressWithHighestBalance([user1.address, user2.address, user3.address]);
    console.log("addressWithHighestBalance:", addressWithHighestBalance);
    expect(addressWithHighestBalance[0]).to.equal(user3.address);
    expect(addressWithHighestBalance[1]).to.equal(1000);
  });

});