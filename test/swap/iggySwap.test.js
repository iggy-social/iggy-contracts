// npx hardhat test test/swap/iggySwap.test.js

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

describe("Iggy Swap tests", function () {
  let uniFactoryContract;
  let uniRouterContract;
  let daiContract;
  let wethContract;
  let aaveContract;
  let iggySwapCustomContract;

  let owner;
  let frontend;
  let iggy;
  let user1;
  let user2;
  let referrer;

  beforeEach(async function () {
    [owner, frontend, iggy, user1, user2, referrer] = await ethers.getSigners();

    const UniswapFactory = await ethers.getContractFactory("UniswapFactory");
    uniFactoryContract = await UniswapFactory.deploy(owner.address);
    await uniFactoryContract.deployed();

    const Dai = await ethers.getContractFactory("MockErc20TokenDecimals");
    daiContract = await Dai.deploy("Dai", "DAI", 18);
    await daiContract.deployed();

    const Weth = await ethers.getContractFactory("MockErc20TokenDecimals");
    wethContract = await Weth.deploy("Weth", "WETH", 18);
    await wethContract.deployed();

    const Aave = await ethers.getContractFactory("MockErc20TokenDecimals");
    aaveContract = await Aave.deploy("Aave", "AAVE", 18);
    await aaveContract.deployed();

    // create router
    const UniswapRouter = await ethers.getContractFactory("UniswapRouter");
    uniRouterContract = await UniswapRouter.deploy(uniFactoryContract.address, wethContract.address);
    await uniRouterContract.deployed();

    const allPairsLengthBefore = await uniFactoryContract.allPairsLength();
    expect(allPairsLengthBefore).to.equal(0);

    // token approvals for router
    await daiContract.approve(uniRouterContract.address, ethers.utils.parseUnits("100000000", "ether"));
    await wethContract.approve(uniRouterContract.address, ethers.utils.parseUnits("100000000", "ether"));
    await aaveContract.approve(uniRouterContract.address, ethers.utils.parseUnits("100000000", "ether"));

    // add liquidity to pair DAI-WETH
    await uniRouterContract.addLiquidity(
      daiContract.address, // token A
      wethContract.address, // token B
      ethers.utils.parseUnits("188", "ether"), // amount A desired
      ethers.utils.parseUnits("0.1", "ether"), // amount B desired
      ethers.utils.parseUnits("188", "ether"), // amount A min
      ethers.utils.parseUnits("0.1", "ether"), // amount B min
      owner.address,
      ethers.constants.MaxUint256 // deadline
    );

    // all pairs length after Dai-Weth pair
    const allPairsLengthAfterDai = await uniFactoryContract.allPairsLength();
    expect(allPairsLengthAfterDai).to.equal(1);

    // add liquidity to pair AAVE-WETH
    await uniRouterContract.addLiquidity(
      aaveContract.address, // token A
      wethContract.address, // token B
      ethers.utils.parseUnits("246", "ether"), // amount A desired
      ethers.utils.parseUnits("10", "ether"), // amount B desired
      ethers.utils.parseUnits("246", "ether"), // amount A min
      ethers.utils.parseUnits("10", "ether"), // amount B min
      owner.address,
      ethers.constants.MaxUint256 // deadline
    );

    // all pairs length after Aave-Weth pair
    const allPairsLengthAfterAave = await uniFactoryContract.allPairsLength();
    expect(allPairsLengthAfterAave).to.equal(2);

    // deploy IggySwapCustom
    const IggySwapCustom = await ethers.getContractFactory("IggySwapCustom");
    iggySwapCustomContract = await IggySwapCustom.deploy(
      frontend.address,
      iggy.address,
      uniRouterContract.address,
      wethContract.address
    );
    await iggySwapCustomContract.deployed();
  });

  xit("gets correct amounts from getAmountsOut() function", async function () {});

});
