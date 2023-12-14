// test on a forked mainnet (polygon)
// 1. First run the forked localhost node: npx hardhat node --fork https://rpc.ankr.com/op // must be Optimism Mainnet
// 2. Then run the tests in a different tab: npx hardhat test test/swap/iggySwapSolidly.optimism.fork.test.js --network localhost

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

xdescribe("Iggy Swap Solidly tests (on a forked Optimism mainnet)", function () {
  let routerAddress = "0x9c12939390052919aF3155f41Bf4160Fd3666A6f"; // velodrome router
  let wethAddress = "0x4200000000000000000000000000000000000006"; // weth
  let daiAddress = "0x7f5c764cbc14f9669b88837ca1490cca17c31607"; // usdc on optimism
  let aaveAddress = "0x4200000000000000000000000000000000000042"; // op on optimism

  let iggySwapRouterContract;

  let owner;
  let frontend;
  let iggy;
  let user1;
  let user2;
  let referrer;
  let staking; // staking contract address

  let swapFee = 80; // 0.8%
  let stakingShare = 0; // 0%
  let frontendShare = 5000; // 50% (after referral fee and staking fee are deducted)

  beforeEach(async function () {
    [owner, frontend, iggy, user1, user2, referrer, staking] = await ethers.getSigners();

    // deploy IggySwapRouter
    const IggySwapRouter = await ethers.getContractFactory("IggySwapRouter");
    iggySwapRouterContract = await IggySwapRouter.deploy(
      frontend.address,
      iggy.address,
      routerAddress,
      staking.address,
      ethers.constants.AddressZero,
      swapFee,
      stakingShare,
      frontendShare
    );
    await iggySwapRouterContract.deployed();
  });

  it("test swapping via Iggy Swap", async function () {
    console.log("--------- First swap (path: MATIC -> DAI) ---------");

    // check owner's ETH balance before swap
    const ownerEthBalanceBefore = await owner.getBalance();
    console.log("Owner's MATIC balance before swap:", ethers.utils.formatUnits(ownerEthBalanceBefore, "ether"), "MATIC");
    expect(ownerEthBalanceBefore).to.be.gt(ethers.utils.parseUnits("9990", "ether"));

    // check frontend's DAI balance before swap
    const daiContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", daiAddress);
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

    // check getAmountsOut first before swap (via iggySwapRouterContract)
    const amountsOut = await iggySwapRouterContract.getAmountsOut(amountIn, path);
    console.log("Amount of DAI to receive (iggy contract):", ethers.utils.formatUnits(amountsOut[path.length-1], "ether"), "DAI");
    expect(amountsOut[path.length-1]).to.be.gt(0);

    // check getAmountsOut first before swap (via router)
    const routerContract = await ethers.getContractAt("contracts/swap/IggySwapRouter.sol:IUniswapV2Router02", routerAddress);
    const amountsOut2 = await routerContract.getAmountsOut(amountIn, path);
    console.log("Amount of DAI to receive (router):", ethers.utils.formatUnits(amountsOut2[path.length-1], "ether"), "DAI");
    expect(amountsOut2[path.length-1]).to.be.gt(0);

    // check owner's DAI balance before swap
    const ownerDaiBalanceBefore = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance before swap:", ethers.utils.formatUnits(ownerDaiBalanceBefore, "ether"), "DAI");
    expect(ownerDaiBalanceBefore).to.equal(0);

    // get price impact
    const priceImpact = await iggySwapRouterContract.getPriceImpact(path[0], path[path.length-1], amountIn);
    console.log(priceImpact);
    console.log("Price impact:", Number(priceImpact), "bps");

    // swapExactETHForTokens (swap ETH for DAI)
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut = amountsOut[path.length-1].sub(amountsOut[path.length-1].div(100)); // 1% slippage
    console.log("Min DAI to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut, "ether"), "DAI");

    const tx = await iggySwapRouterContract.swapExactETHForTokens(
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

    console.log("--------- second swap (path: DAI -> MATIC -> AAVE) ---------");

    // check owner's AAVE balance before second swap
    const aaveContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", aaveAddress);
    const ownerAaveBalanceBefore = await aaveContract.balanceOf(owner.address);
    console.log("Owner's AAVE balance before swap:", ethers.utils.formatUnits(ownerAaveBalanceBefore, "ether"), "AAVE");
    expect(ownerAaveBalanceBefore).to.equal(0);

    // set amount in and path for the DAI -> AAVE swap
    const amountIn3 = ethers.utils.parseUnits("200", "ether"); // 200 DAI
    console.log("Amount of DAI to swap:", ethers.utils.formatUnits(amountIn3, "ether"), "DAI");

    const path3 = [daiAddress, wethAddress, aaveAddress]; // path to swap dai for aave

    // check getAmountsOut first before swap (via iggySwapRouterContract)
    const amountsOut3 = await iggySwapRouterContract.getAmountsOut(amountIn3, path3);
    console.log("Amount of AAVE to receive:", ethers.utils.formatUnits(amountsOut3[path3.length-1], "ether"), "AAVE");
    expect(amountsOut3[path3.length-1]).to.be.gt(0);

    // set allowance for DAI
    await daiContract.approve(iggySwapRouterContract.address, amountIn3);

    // get price impact
    const priceImpact2 = await iggySwapRouterContract.getPriceImpact(path3[0], path3[path.length-1], amountIn3);
    console.log(priceImpact2);
    console.log("Price impact 2:", Number(priceImpact2), "bps");

    // swapExactTokensForTokens (swap DAI for AAVE)
    const deadline3 = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut3 = amountsOut3[path3.length-1].sub(amountsOut3[path3.length-1].div(100)); // 1% slippage
    console.log("Min AAVE to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut3, "ether"), "AAVE");

    const tx3 = await iggySwapRouterContract.swapExactTokensForTokens(
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

    console.log("--------- third swap (path: AAVE -> MATIC) ---------");

    // set amount in and path for the AAVE -> MATIC swap
    const amountIn4 = ethers.utils.parseUnits("0.01", "ether"); // 1 AAVE
    console.log("Amount of AAVE to swap:", ethers.utils.formatUnits(amountIn4, "ether"), "AAVE");

    const path4 = [aaveAddress, wethAddress]; // path to swap aave for matic

    // check getAmountsOut first before swap (via iggySwapRouterContract)
    const amountsOut4 = await iggySwapRouterContract.getAmountsOut(amountIn4, path4);
    console.log("Amount of MATIC to receive:", ethers.utils.formatUnits(amountsOut4[path4.length-1], "ether"), "MATIC");
    expect(amountsOut4[path4.length-1]).to.be.gt(0);

    // set allowance for AAVE
    await aaveContract.approve(iggySwapRouterContract.address, amountIn4);

    // get price impact
    const priceImpact3 = await iggySwapRouterContract.getPriceImpact(path4[0], path4[path.length-1], amountIn3);
    console.log(priceImpact3);
    console.log("Price impact 3:", Number(priceImpact3), "bps");

    // swapExactTokensForETH (swap AAVE for MATIC)
    const deadline4 = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
    const minAmountOut4 = amountsOut4[path4.length-1].sub(amountsOut4[path4.length-1].div(100)); // 1% slippage
    console.log("Min MATIC to receive (deduct 1% slippage):", ethers.utils.formatUnits(minAmountOut4, "ether"), "MATIC");

    const tx4 = await iggySwapRouterContract.swapExactTokensForETH(
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

  it("adds liquidity to the MATIC/DAI pool and then removes it", async function() {
    console.log("------ ADDING LIQUIDITY ------ ");

    const daiContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", daiAddress);

    // get LP token balance (call getLpTokenAddress from the iggySwapRouterContract to get LP token address first)
    const lpTokenAddress = await iggySwapRouterContract.getLpTokenAddress(daiAddress, wethAddress);
    console.log("LP token address:", lpTokenAddress);

    const lpTokenContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", lpTokenAddress);
    const lpTokenBalanceBefore = await lpTokenContract.balanceOf(owner.address);
    console.log("Owner's LP token balance before adding liquidity:", ethers.utils.formatUnits(lpTokenBalanceBefore, "ether"), "LP tokens");

    // check DAI balance before adding liquidity
    const ownerDaiBalanceBefore = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance before adding liquidity:", ethers.utils.formatUnits(ownerDaiBalanceBefore, "ether"), "DAI");

    const amountInDesired = ethers.utils.parseUnits("10", "ether"); // 10 DAI
    const amountInMin = amountInDesired.sub(amountInDesired.div(10)); // 10% slippage

    // give DAI allowance to the iggySwapRouterContract
    await daiContract.approve(iggySwapRouterContract.address, amountInDesired);

    // call addLiquidityETH function in a read-only way to get the amount of MATIC to send
    const result = await iggySwapRouterContract.callStatic.addLiquidityETH(
      daiAddress,
      amountInDesired, // amount DAI desired
      amountInMin, // amount DAI min
      0, // amount ETH min
      owner.address, // recipient (to)
      Math.floor(Date.now() / 1000) + 60 * 20, // deadline: 20 minutes from the current Unix time
      {
        value: ethers.utils.parseUnits("100", "ether"), // some amount of ETH (doesn't matter, but needs to be big enough)
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    console.log("Amount of MATIC to send:", ethers.utils.formatUnits(result[1], "ether"), "MATIC");

    // addLiquidityETH (write)
    const tx = await iggySwapRouterContract.addLiquidityETH(
      daiAddress,
      amountInDesired, // amount DAI desired
      amountInMin, // amount DAI min
      0, // amount ETH min
      owner.address, // recipient (to)
      Math.floor(Date.now() / 1000) + 60 * 20, // deadline: 20 minutes from the current Unix time
      {
        value: result[1].add(result[1].div(10)), // result[1] + 10% slippage
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    const receipt = await tx.wait();
    calculateGasCosts("Add liquidity", receipt);

    // check DAI balance after adding liquidity
    const ownerDaiBalanceAfter = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance after adding liquidity:", ethers.utils.formatUnits(ownerDaiBalanceAfter, "ether"), "DAI");
    expect(ownerDaiBalanceAfter).to.equal(ownerDaiBalanceBefore.sub(amountInDesired));

    // check LP token balance after adding liquidity
    const lpTokenBalanceAfter = await lpTokenContract.balanceOf(owner.address);
    console.log("Owner's LP token balance after adding liquidity:", ethers.utils.formatUnits(lpTokenBalanceAfter, "ether"), "LP tokens");
    expect(lpTokenBalanceAfter).to.be.gt(lpTokenBalanceBefore);

    console.log("------ REMOVING LIQUIDITY ------ ");

    // calculate amount of DAI and ETH to receive
    const amountEthDai = await iggySwapRouterContract.calculateETHAndTokensToReceive(lpTokenContract.address, lpTokenBalanceAfter);
    console.log("Amount of ETH and DAI to receive:", ethers.utils.formatEther(amountEthDai[0]), "ETH,", ethers.utils.formatEther(amountEthDai[1]), "DAI");

    // give LP token allowance to the iggySwapRouterContract
    await lpTokenContract.approve(iggySwapRouterContract.address, lpTokenBalanceAfter);

    // removeLiquidityETH (write)
    const tx2 = await iggySwapRouterContract.removeLiquidityETH(
      daiAddress,
      lpTokenBalanceAfter, // amount LP tokens to remove
      0, // amount DAI min
      0, // amount ETH min
      owner.address, // recipient (to)
      Math.floor(Date.now() / 1000) + 60 * 20, // deadline: 20 minutes from the current Unix time
      {
        gasPrice: ethers.utils.parseUnits("500", "gwei"),
        gasLimit: 500000
      }
    );
    const receipt2 = await tx2.wait();
    calculateGasCosts("Remove liquidity", receipt2);

    // check DAI balance after removing liquidity
    const ownerDaiBalanceAfter2 = await daiContract.balanceOf(owner.address);
    console.log("Owner's DAI balance after removing liquidity:", ethers.utils.formatUnits(ownerDaiBalanceAfter2, "ether"), "DAI");
    expect(ownerDaiBalanceAfter2).to.be.gt(ownerDaiBalanceAfter);
    console.log("Difference:", ethers.utils.formatEther(ownerDaiBalanceAfter2.sub(ownerDaiBalanceAfter)), "DAI");

    // check LP token balance after removing liquidity
    const lpTokenBalanceAfter2 = await lpTokenContract.balanceOf(owner.address);
    console.log("Owner's LP token balance after removing liquidity:", ethers.utils.formatUnits(lpTokenBalanceAfter2, "ether"), "LP tokens");
    expect(lpTokenBalanceAfter2).to.equal(0);

  });

});
