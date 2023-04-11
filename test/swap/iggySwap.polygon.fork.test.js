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
  let aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b"; // aave on polygon

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
    console.log("--------- First swap (MATIC -> DAI) ---------");

    // check owner's ETH balance before swap
    const ownerEthBalanceBefore = await owner.getBalance();
    console.log("Owner's MATIC balance before swap:", ethers.utils.formatUnits(ownerEthBalanceBefore, "ether"), "MATIC");
    expect(ownerEthBalanceBefore).to.be.gt(ethers.utils.parseUnits("9990", "ether"));

    // check frontend's DAI balance before swap
    const daiContract = await ethers.getContractAt("IERC20", daiAddress);
    const frontendDaiBalanceBefore = await daiContract.balanceOf(frontend.address);
    console.log("Frontend's DAI balance before swap:", ethers.utils.formatUnits(frontendDaiBalanceBefore, "ether"), "DAI");
    expect(frontendDaiBalanceBefore).to.be.eq(0);

    // check iggy's DAI balance before swap
    const iggyDaiBalanceBefore = await daiContract.balanceOf(iggy.address);
    console.log("Iggy's DAI balance before swap:", ethers.utils.formatUnits(iggyDaiBalanceBefore, "ether"), "DAI");
    expect(iggyDaiBalanceBefore).to.be.eq(0);

    // set amount in and path for the MATIC -> DAI swap
    const amountIn = ethers.utils.parseUnits("400", "ether"); // 400 MATIC
    console.log("Amount of MATIC to swap:", ethers.utils.formatUnits(amountIn, "ether"), "MATIC");

    const path = [wethAddress, daiAddress]; // path to swap eth for dai

    // check getAmountsOut first before swap (via iggySwapCustomContract)
    const amountsOut = await iggySwapCustomContract.getAmountsOut(amountIn, path);
    console.log("Amount of DAI to receive (iggy contract):", ethers.utils.formatUnits(amountsOut[path.length-1], "ether"), "DAI");
    expect(amountsOut[path.length-1]).to.be.gt(0);

    // check getAmountsOut first before swap (via router)
    const routerContract = await ethers.getContractAt("IUniswapV2Router02", routerAddress);
    const amountsOut2 = await routerContract.getAmountsOut(amountIn, path);
    console.log("Amount of DAI to receive (router):", ethers.utils.formatUnits(amountsOut2[path.length-1], "ether"), "DAI");
    expect(amountsOut2[path.length-1]).to.be.gt(0);

    // check owner's DAI balance before swap
    const ownerDaiBalanceBefore = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance before swap:", ethers.utils.formatUnits(ownerDaiBalanceBefore, "ether"), "DAI");
    expect(ownerDaiBalanceBefore).to.equal(0);

    // swapExactETHForTokens (swap ETH for DAI)
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut = amountsOut[path.length-1].sub(amountsOut[path.length-1].div(100)); // 1% slippage
    console.log("Min DAI to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut, "ether"), "DAI");

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
    calculateGasCosts("Swap (MATIC -> DAI)", receipt);

    // check owner's DAI balance after swap
    const ownerDaiBalanceAfter = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance after swap:", ethers.utils.formatUnits(ownerDaiBalanceAfter, "ether"), "DAI");
    expect(ownerDaiBalanceAfter).to.be.gt(0);

    // check frontend's DAI balance after swap
    const frontendDaiBalanceAfter = await daiContract.balanceOf(frontend.address);
    console.log("Frontend's DAI balance after swap:", ethers.utils.formatUnits(frontendDaiBalanceAfter, "ether"), "DAI");
    expect(frontendDaiBalanceAfter).to.be.gt(0);

    // check iggy's DAI balance after swap
    const iggyDaiBalanceAfter = await daiContract.balanceOf(iggy.address);
    console.log("Iggy's DAI balance after swap:", ethers.utils.formatUnits(iggyDaiBalanceAfter, "ether"), "DAI");
    expect(iggyDaiBalanceAfter).to.be.gt(0);

    // check owner's ETH balance after swap
    const ownerEthBalanceAfter = await owner.getBalance();
    console.log("Owner's MATIC balance after swap:", ethers.utils.formatUnits(ownerEthBalanceAfter, "ether"), "MATIC");
    expect(ownerEthBalanceAfter).to.be.lt(ownerEthBalanceBefore);

    console.log("--------- second swap (DAI -> AAVE) ---------");

    // check owner's AAVE balance before second swap
    const aaveContract = await ethers.getContractAt("IERC20", aaveAddress);
    const ownerAaveBalanceBefore = await aaveContract.balanceOf(owner.address);
    console.log("Owner's AAVE balance before swap:", ethers.utils.formatUnits(ownerAaveBalanceBefore, "ether"), "AAVE");
    expect(ownerAaveBalanceBefore).to.equal(0);

    // set amount in and path for the DAI -> AAVE swap
    const amountIn3 = ethers.utils.parseUnits("300", "ether"); // 300 DAI
    console.log("Amount of DAI to swap:", ethers.utils.formatUnits(amountIn3, "ether"), "DAI");

    const path3 = [daiAddress, wethAddress, aaveAddress]; // path to swap dai for aave

    // check getAmountsOut first before swap (via iggySwapCustomContract)
    const amountsOut3 = await iggySwapCustomContract.getAmountsOut(amountIn3, path3);
    console.log("Amount of AAVE to receive:", ethers.utils.formatUnits(amountsOut3[path3.length-1], "ether"), "AAVE");
    expect(amountsOut3[path3.length-1]).to.be.gt(0);

    // set allowance for DAI
    await daiContract.approve(iggySwapCustomContract.address, amountIn3);

    // swapExactTokensForTokens (swap DAI for AAVE)
    const deadline3 = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut3 = amountsOut3[path3.length-1].sub(amountsOut3[path3.length-1].div(100)); // 1% slippage
    console.log("Min AAVE to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut3, "ether"), "AAVE");

    const tx3 = await iggySwapCustomContract.swapExactTokensForTokens(
      amountIn3,
      minAmountOut3,
      path3,
      owner.address,
      deadline3,
      {
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    const receipt3 = await tx3.wait();
    calculateGasCosts("Swap (DAI -> AAVE)", receipt3);

    // check owner's AAVE balance after swap
    const ownerAaveBalanceAfter = await aaveContract.balanceOf(owner.address);
    console.log("Owner's AAVE balance after swap:", ethers.utils.formatUnits(ownerAaveBalanceAfter, "ether"), "AAVE");
    expect(ownerAaveBalanceAfter).to.be.gt(0);

    // check owner's ETH balance after swap
    const ownerEthBalanceAfter3 = await owner.getBalance();
    console.log("Owner's MATIC balance after swap:", ethers.utils.formatUnits(ownerEthBalanceAfter3, "ether"), "MATIC");
    expect(ownerEthBalanceAfter3).to.be.lt(ownerEthBalanceBefore);

    // check owner's DAI balance after swap
    const ownerDaiBalanceAfter3 = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance after swap:", ethers.utils.formatUnits(ownerDaiBalanceAfter3, "ether"), "DAI");
    expect(ownerDaiBalanceAfter3).to.equal(ownerDaiBalanceAfter.sub(amountIn3));

    console.log("--------- third swap (AAVE -> MATIC) ---------");

    // set amount in and path for the AAVE -> MATIC swap
    const amountIn4 = ethers.utils.parseUnits("0.01", "ether"); // 1 AAVE
    console.log("Amount of AAVE to swap:", ethers.utils.formatUnits(amountIn4, "ether"), "AAVE");

    const path4 = [aaveAddress, wethAddress]; // path to swap aave for matic

    // check getAmountsOut first before swap (via iggySwapCustomContract)
    const amountsOut4 = await iggySwapCustomContract.getAmountsOut(amountIn4, path4);
    console.log("Amount of MATIC to receive:", ethers.utils.formatUnits(amountsOut4[path4.length-1], "ether"), "MATIC");
    expect(amountsOut4[path4.length-1]).to.be.gt(0);

    // set allowance for AAVE
    await aaveContract.approve(iggySwapCustomContract.address, amountIn4);

    // swapExactTokensForETH (swap AAVE for MATIC)
    const deadline4 = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut4 = amountsOut4[path4.length-1].sub(amountsOut4[path4.length-1].div(100)); // 1% slippage
    console.log("Min MATIC to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut4, "ether"), "MATIC");

    const tx4 = await iggySwapCustomContract.swapExactTokensForETH(
      amountIn4,
      minAmountOut4,
      path4,
      owner.address,
      deadline4,
      {
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    const receipt4 = await tx4.wait();
    calculateGasCosts("Swap (AAVE -> MATIC)", receipt4);

    // check owner's MATIC balance after swap
    const ownerEthBalanceAfter4 = await owner.getBalance();
    console.log("Owner's MATIC balance after swap:", ethers.utils.formatUnits(ownerEthBalanceAfter4, "ether"), "MATIC");
    expect(ownerEthBalanceAfter4).to.be.gt(ownerEthBalanceAfter3);

    // check owner's AAVE balance after swap
    const ownerAaveBalanceAfter4 = await aaveContract.balanceOf(owner.address);
    console.log("Owner's AAVE balance after swap:", ethers.utils.formatUnits(ownerAaveBalanceAfter4, "ether"), "AAVE");
    expect(ownerAaveBalanceAfter4).to.equal(ownerAaveBalanceAfter.sub(amountIn4));

  });

});
