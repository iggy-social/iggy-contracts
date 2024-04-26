// npx hardhat test test/activity-points/activityPointsScrolly.test.js

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

describe("Activity Points (Scrolly Hub)", function () {
  let activityPointsContract;
  let statsContract;

  const multiplier = 1000000;
  const multiplierOtherActions = 5;

  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [
      owner, user1, user2
    ] = await ethers.getSigners();

    const Stats = await ethers.getContractFactory("Stats");
    statsContract = await Stats.deploy();
    await statsContract.deployed();

    await statsContract.addWriter(owner.address);

    const ActivityPoints = await ethers.getContractFactory("ActivityPointsScrolly");
    activityPointsContract = await ActivityPoints.deploy(
      statsContract.address,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );
    await activityPointsContract.deployed();
  });

  it("shows activity points for users", async function () {
    user1points1 = await activityPointsContract.getPoints(user1.address);
    expect(user1points1).to.equal(0);
    console.log("user1 points1:", Number(user1points1));

    user2points1 = await activityPointsContract.getPoints(user2.address);
    expect(user2points1).to.equal(0);
    console.log("user2 points1:", Number(user2points1));

    // add wei spent to user1 via the stats contract
    const weiSpent = ethers.utils.parseEther("0.1337");
    await statsContract.addWeiSpent(user1.address, weiSpent);

    user1points2 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points2:", ethers.utils.formatEther(user1points2) + " points");
    expect(user1points2).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions));

    user2points2 = await activityPointsContract.getPoints(user2.address);
    console.log("user2 points2:", ethers.utils.formatEther(user2points2) + " points");
    expect(user2points2).to.equal(0);

    // add bonus points to user1 via the activity points contract
    const bonusPoints = ethers.utils.parseEther("0.69");
    await activityPointsContract.addBonusPoints(user1.address, bonusPoints);

    user1points3 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points3:", ethers.utils.formatEther(user1points3) + " points");
    expect(user1points3).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions).add(bonusPoints));

    user2points3 = await activityPointsContract.getPoints(user2.address);
    console.log("user2 points3:", ethers.utils.formatEther(user2points3) + " points");
    expect(user2points3).to.equal(0);

    // add bonus points to user2 via the activity points contract
    const bonusPoints2 = ethers.utils.parseEther("4.2069");
    await activityPointsContract.addBonusPoints(user2.address, bonusPoints2);
    
    user1points4 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points4:", ethers.utils.formatEther(user1points4) + " points");
    expect(user1points4).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions).add(bonusPoints));

    user2points4 = await activityPointsContract.getPoints(user2.address);
    console.log("user2 points4:", ethers.utils.formatEther(user2points4) + " points");
    expect(user2points4).to.equal(bonusPoints2);

    // remove 0.06 bonus points from user1 via the activity points contract
    const bonusPoints3 = ethers.utils.parseEther("0.06");
    await activityPointsContract.removeBonusPoints(user1.address, bonusPoints3);

    // remove 0.0069 bonus points from user2 via the activity points contract
    const bonusPoints4 = ethers.utils.parseEther("0.0069");
    await activityPointsContract.removeBonusPoints(user2.address, bonusPoints4);

    user1points5 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points5:", ethers.utils.formatEther(user1points5) + " points");
    expect(user1points5).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions).add(bonusPoints).sub(bonusPoints3));

    user2points5 = await activityPointsContract.getPoints(user2.address);
    console.log("user2 points5:", ethers.utils.formatEther(user2points5) + " points");
    expect(user2points5).to.equal(bonusPoints2.sub(bonusPoints4));

    // add bonus wei spent to user1 via the activity points contract
    const weiSpent2 = ethers.utils.parseEther("0.42");
    await activityPointsContract.addBonusWei(user1.address, weiSpent2);

    user1points6 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points6:", ethers.utils.formatEther(user1points6) + " points");
    expect(user1points6).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions).add(bonusPoints).sub(bonusPoints3).add(weiSpent2.mul(multiplier)));

    // remove the added bonus wei spent from user1 via the activity points contract
    await activityPointsContract.removeBonusWei(user1.address, weiSpent2);

    user1points7 = await activityPointsContract.getPoints(user1.address);
    console.log("user1 points7:", ethers.utils.formatEther(user1points7) + " points");
    expect(user1points7).to.equal(weiSpent.mul(multiplier).mul(multiplierOtherActions).add(bonusPoints).sub(bonusPoints3));

    // fail at removing more bonus wei spent than user1 has
    const weiSpent3 = ethers.utils.parseEther("1000");
    await expect(activityPointsContract.removeBonusWei(user1.address, weiSpent3)).to.be.revertedWith("ActivityPoints: not enough bonus wei");

    // fail at removing more bonus points than user1 has
    await expect(activityPointsContract.removeBonusPoints(user1.address, weiSpent3)).to.be.revertedWith("ActivityPoints: not enough bonus points");

    // check multiplier
    const multiplierBefore = await activityPointsContract.multiplier();
    console.log("Multiplier before:", Number(multiplierBefore));

    // owner change multiplier
    const newMultiplier = 1000;
    await activityPointsContract.setMultiplier(newMultiplier);

    const multiplierAfter = await activityPointsContract.multiplier();
    console.log("Multiplier after:", Number(multiplierAfter));
    expect(multiplierAfter).to.equal(newMultiplier);
  });

});