// test on a forked mainnet (polygon)
// 1. First run the forked localhost node: npx hardhat node --fork https://poly-rpc.gateway.pokt.network
// 2. Then run the tests in a different tab: npx hardhat test test/swap/iggySwap.polygon.fork.test.js --network localhost

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

describe("Iggy Swap tests (on a forked mainnet)", function () {
  let routerAddress = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"; // quickswap router
  let wethAddress = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // wmatic
  let daiAddress = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"; // dai on polygon

  let iggySwapCustomContract;

  let owner;
  let frontend;
  let iggy;
  let user1;
  let user2;
  let referrer;

  beforeEach(async function () {
    [owner, frontend, iggy, user1, user2, referrer] = await ethers.getSigners();

    // deploy IggySwapCustom
    const IggySwapCustom = await ethers.getContractFactory("IggySwapCustom");
    iggySwapCustomContract = await IggySwapCustom.deploy(
      frontend.address,
      iggy.address,
      routerAddress,
      wethAddress
    );
    await iggySwapCustomContract.deployed();
  });

  it("test swapping via Iggy Swap", async function () {
    // check owner's ETH balance before swap
    const ownerEthBalanceBefore = await owner.getBalance();
    console.log("ownerEthBalanceBefore:", ethers.utils.formatUnits(ownerEthBalanceBefore, "ether"), "MATIC");
    expect(ownerEthBalanceBefore).to.be.gt(ethers.utils.parseUnits("9990", "ether"));

    // swapExactETHForTokens (swap ETH for DAI)
    const amountIn = ethers.utils.parseUnits("1", "ether"); // 1 MATIC
    console.log("amountIn:", ethers.utils.formatUnits(amountIn, "ether"), "MATIC");

    const path = [wethAddress, daiAddress]; // path to swap eth for dai

    // check getAmountsOut first before swap (via iggySwapCustomContract)
    const amountsOut = await iggySwapCustomContract.getAmountsOut(amountIn, path);
    console.log("amountsOut[1]:", ethers.utils.formatUnits(amountsOut[1], "ether"), "DAI");
    expect(amountsOut[1]).to.be.gt(0);

    // check getAmountsOut first before swap (via router)
    const routerContract = await ethers.getContractAt("IUniswapV2Router02", routerAddress);
    const amountsOut2 = await routerContract.getAmountsOut(amountIn, path);
    console.log("amountsOut2[1]:", ethers.utils.formatUnits(amountsOut2[1], "ether"), "DAI");
    expect(amountsOut2[1]).to.be.gt(0);

    // check owner's DAI balance before swap
    const daiContract = await ethers.getContractAt("IERC20", daiAddress);
    const ownerDaiBalanceBefore = await daiContract.balanceOf(owner.address);
    console.log("ownerDaiBalanceBefore:", ethers.utils.formatUnits(ownerDaiBalanceBefore, "ether"), "DAI");
    expect(ownerDaiBalanceBefore).to.equal(0);

    // swap
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut = amountsOut[1].sub(amountsOut[1].div(100)); // 1% slippage
    console.log("minAmountOut (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut, "ether"), "DAI");

    const tx = await iggySwapCustomContract.swapExactETHForTokens(
      minAmountOut,
      path,
      owner.address,
      deadline,
      { 
        value: amountIn,
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    const receipt = await tx.wait();
    calculateGasCosts("swapExactETHForTokens", receipt);

    // check owner's DAI balance after swap
    const ownerDaiBalanceAfter = await daiContract.balanceOf(owner.address);
    console.log("ownerDaiBalanceAfter:", ethers.utils.formatUnits(ownerDaiBalanceAfter, "ether"), "DAI");
    expect(ownerDaiBalanceAfter).to.be.gt(0);

    /*
    const amountIn = ethers.utils.parseUnits("1", "ether"); // 1 DAI
    const path = [daiAddress, wethAddress]; // path to swap dai for eth

    //console.log("amountIn: ", Number(amountIn));
    //console.log("path: ", path);

    const amountsOut = await iggySwapCustomContract.getAmountsOut(amountIn, path);
    //console.log("amountsOut[0]:", Number(amountsOut[0]));
    console.log("amountsOut[1]:", ethers.utils.formatUnits(amountsOut[1], "ether"), "WETH");
    expect(amountsOut[1]).to.be.gt(0);

    const minAmountOut = amountsOut[1].sub(amountsOut[1].div(100)); // 1% slippage
    console.log("minAmountOut:", ethers.utils.formatUnits(minAmountOut, "ether"), "WETH");

    // add allowance to iggy swap contract
    const daiContract = await ethers.getContractAt("IERC20", daiAddress);
    await daiContract.connect(owner).approve(iggySwapCustomContract.address, amountIn);

    // check owner's DAI balance before swap
    const ownerDaiBalanceBefore = await daiContract.balanceOf(owner.address);
    expect(ownerDaiBalanceBefore).to.equal(ethers.utils.parseUnits("1000", "ether")); // 1000 DAI
    console.log("ownerDaiBalanceBefore:", ethers.utils.formatUnits(ownerDaiBalanceBefore, "ether"), "DAI");
    */

    // swap
    /*
    const tx = await iggySwapCustomContract.connect(owner).swapExactTokensForTokens(
      amountIn,
      minAmountOut,
      path,
      user1.address,
      referrer.address
    );
    */
  });

});
