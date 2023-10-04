// npx hardhat test test/distributor/revenueDistributor.test.js

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

describe("RevenueDistributor", function () {
  let distributorContract;

  let owner;
  let user1;
  let user2;
  let recipient1;
  let recipient2;
  let recipient3;
  let recipient4;
  let recipient5;
  let recipient6;

  const recipient1Percent = ethers.utils.parseEther("0.05"); // 5%
  const recipient2Percent = ethers.utils.parseEther("0.15"); // 15%
  const recipient3Percent = ethers.utils.parseEther("0.25"); // 25%
  const recipient4Percent = ethers.utils.parseEther("0.05"); // 5%
  const recipient5Percent = ethers.utils.parseEther("0.30"); // 30%
  const recipient6Percent = ethers.utils.parseEther("0.20"); // 20%

  beforeEach(async function () {
    [
      owner, user1, user2, recipient1, recipient2, recipient3, recipient4, recipient5, recipient6
    ] = await ethers.getSigners();

    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    distributorContract = await RevenueDistributor.deploy();
    await distributorContract.deployed();

    // add recipients
    await distributorContract.addRecipient(recipient1.address, "Recipient 1", recipient1Percent);
    await distributorContract.addRecipient(recipient2.address, "Recipient 2", recipient2Percent);
    await distributorContract.addRecipient(recipient3.address, "Recipient 3", recipient3Percent);
    await distributorContract.addRecipient(recipient4.address, "Recipient 4", recipient4Percent);
    await distributorContract.addRecipient(recipient5.address, "Recipient 5", recipient5Percent);
    await distributorContract.addRecipient(recipient6.address, "Recipient 6", recipient6Percent);
  });

  it("reverts when trying to add one more recipient and the total is larger than 100%", async function () {
    await expect(
      distributorContract.addRecipient(user1.address, "Recipient 7", ethers.utils.parseEther("0.01"))
    ).to.be.revertedWith("RevenueDistributor: percentage total must be less than or equal to 100%");
  });

  it("reverts when trying to add existing recipient", async function () {
    // remove last recipient
    await distributorContract.removeLastRecipient();

    // add recipient1 again
    await expect(
      distributorContract.addRecipient(recipient1.address, "Recipient 1 again", ethers.utils.parseEther("0.01"))
    ).to.be.revertedWith("RevenueDistributor: recipient already in the list");
  });

  it("distributes funds to recipients", async function () {
    const initialBalance = ethers.utils.parseEther("10000");

    // check balances of recipients before the distribution
    expect(await ethers.provider.getBalance(recipient1.address)).to.equal(initialBalance);
    expect(await ethers.provider.getBalance(recipient2.address)).to.equal(initialBalance);
    expect(await ethers.provider.getBalance(recipient3.address)).to.equal(initialBalance);
    expect(await ethers.provider.getBalance(recipient4.address)).to.equal(initialBalance);
    expect(await ethers.provider.getBalance(recipient5.address)).to.equal(initialBalance);
    expect(await ethers.provider.getBalance(recipient6.address)).to.equal(initialBalance);

    // user1 sends 100 ETH to the contract
    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
    expect(await ethers.provider.getBalance(user1.address)).to.equal(initialBalance);

    expect(await ethers.provider.getBalance(distributorContract.address)).to.equal(0);

    const tx = await user1.sendTransaction({
      to: distributorContract.address,
      value: ethers.utils.parseEther("100"),
    });
    const receipt = await tx.wait();

    calculateGasCosts("distributes funds to recipients", receipt);

    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
    expect(user1BalanceAfter).to.be.closeTo(user1BalanceBefore.sub(ethers.utils.parseEther("100")), ethers.utils.parseEther("0.1"));

    // check balances of recipients after the distribution
    const r1bal = await ethers.provider.getBalance(recipient1.address);
    console.log(ethers.utils.formatEther(r1bal));

    expect(await ethers.provider.getBalance(recipient1.address)).to.equal(initialBalance.add(recipient1Percent.mul(100)));
    expect(await ethers.provider.getBalance(recipient2.address)).to.equal(initialBalance.add(recipient2Percent.mul(100)));
    expect(await ethers.provider.getBalance(recipient3.address)).to.equal(initialBalance.add(recipient3Percent.mul(100)));
    expect(await ethers.provider.getBalance(recipient4.address)).to.equal(initialBalance.add(recipient4Percent.mul(100)));
    expect(await ethers.provider.getBalance(recipient5.address)).to.equal(initialBalance.add(recipient5Percent.mul(100)));
    expect(await ethers.provider.getBalance(recipient6.address)).to.equal(initialBalance.add(recipient6Percent.mul(100)));
  });

  it("removes a recipient and adds a new one, and then updates the percentage of the new one", async function () {
    const isRecipientBefore = await distributorContract.isRecipient(recipient3.address);
    expect(isRecipientBefore).to.equal(true);

    await distributorContract.removeRecipientByAddress(recipient3.address);

    const isRecipientAfter = await distributorContract.isRecipient(recipient3.address);
    expect(isRecipientAfter).to.equal(false);

    await distributorContract.addRecipient(user1.address, "Recipient 7", ethers.utils.parseEther("0.01"));

    // fails at update for recipient 7 because the percentage is larger than 25%
    await expect(
      distributorContract.updateRecipientByAddress(user1.address, user1.address, "Recipient 7", ethers.utils.parseEther("0.26"))
    ).to.be.revertedWith("RevenueDistributor: percentage total must be less than or equal to 100%");

    // succeeds at update for recipient 7 because the percentage is 25%
    await distributorContract.updateRecipientByAddress(user1.address, user1.address, "Recipient 7 new", ethers.utils.parseEther("0.25"));

    // check recipient's percentage and label via getRecipient
    const recipient7 = await distributorContract.getRecipient(user1.address);
    console.log(ethers.utils.formatEther(recipient7.percentage));
    expect(recipient7.percentage).to.equal(ethers.utils.parseEther("0.25"));
    expect(recipient7.label).to.equal("Recipient 7 new");
  });

  it("removes last recipient and adds a bunch of new ones with 1% share each", async function () {
    await distributorContract.removeLastRecipient();

    // getRecipientsLength before adding new recipients
    const recipientsLengthBefore = await distributorContract.getRecipientsLength();
    console.log("recipientsLengthBefore: " + recipientsLengthBefore);

    const limit = 20;
    let signers = await ethers.getSigners();

    // loop thorugh fillerAddresses and add them as recipients with 1% share each
    for (let i = 9; i < limit; i++) {
      //console.log("Adding filler " + i);
      //console.log(signers[i].address);
      await distributorContract.addRecipient(signers[i].address, "Filler " + i, ethers.utils.parseEther("0.01"));
    }

    // getRecipientsLength after adding new recipients
    const recipientsLengthAfter = await distributorContract.getRecipientsLength();
    console.log("recipientsLengthAfter: " + recipientsLengthAfter);

    const tx = await user1.sendTransaction({
      to: distributorContract.address,
      value: ethers.utils.parseEther("100"),
    });
    const receipt = await tx.wait();

    calculateGasCosts("distributes funds to recipients", receipt);

    // getRecipients and print them in console log
    const recipients = await distributorContract.getRecipients();
    //console.log(recipients);

    // removeLastRecipient
    await distributorContract.removeLastRecipient();
    expect(await distributorContract.getRecipientsLength()).to.equal(recipientsLengthAfter - 1);

    // removeAllRecipients
    await distributorContract.removeAllRecipients();
    expect(await distributorContract.getRecipientsLength()).to.equal(0);
  });

  it("updates recipient by index", async function () {
    // check recipient's percentage and label via getRecipient
    const recipient3before = await distributorContract.getRecipient(recipient3.address);
    expect(recipient3before.percentage).to.equal(recipient3Percent);
    expect(recipient3before.label).to.equal("Recipient 3");

    // update recipient's percentage and label via updateRecipientByIndex
    await distributorContract.updateRecipientByIndex(2, recipient3.address, "Recipient 3 new", ethers.utils.parseEther("0.05"));

    // check recipient's percentage and label via getRecipient
    const recipient3Updated = await distributorContract.getRecipient(recipient3.address);
    expect(recipient3Updated.percentage).to.equal(ethers.utils.parseEther("0.05"));
    expect(recipient3Updated.label).to.equal("Recipient 3 new");

    // check contract balance before the distribution
    expect(await ethers.provider.getBalance(distributorContract.address)).to.equal(0);

    // make a distribution
    const tx = await user1.sendTransaction({
      to: distributorContract.address,
      value: ethers.utils.parseEther("100"),
    });
    
    // check contract balance after the distribution (20% should be left in the contract, because recipient3's percentage was changed from 25% to 5%)
    expect(await ethers.provider.getBalance(distributorContract.address)).to.equal(ethers.utils.parseEther("20"));

    // withdraw remaining ETH from the contract via withdrawEth
    await distributorContract.withdrawEth();

    // check contract balance after the withdrawal (should be 0)
    expect(await ethers.provider.getBalance(distributorContract.address)).to.equal(0);
  });

  it("adds user1 as manager", async function () {
    // check if user 1 is a manager (isManager)
    const isManagerBefore = await distributorContract.isManager(user1.address);
    expect(isManagerBefore).to.equal(false);

    // revert when user1 is trying to add a new recipient
    await expect(
      distributorContract.connect(user1).addRecipient(user2.address, "Recipient 7", ethers.utils.parseEther("0.01"))
    ).to.be.revertedWith("OwnableWithManagers: caller is not a manager or owner");

    // add user1 as manager via addManager
    await distributorContract.addManager(user1.address);

    // check if user 1 is a manager (isManager)
    const isManagerAfter = await distributorContract.isManager(user1.address);
    expect(isManagerAfter).to.equal(true);

    // remove the last recipient via user1
    await distributorContract.connect(user1).removeLastRecipient();

    // add a new recipient via user1
    await distributorContract.connect(user1).addRecipient(user2.address, "Recipient 7", ethers.utils.parseEther("0.01"));

    // remove user1 as manager via removeManagerByAddress
    await distributorContract.removeManagerByAddress(user1.address);

    // check if user 1 is a manager (isManager)
    const isManagerAfterRemove = await distributorContract.isManager(user1.address);
    expect(isManagerAfterRemove).to.equal(false);

  });

});