// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IStats {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
}

interface IUniswapV2Factory {
  function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
  function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

interface IUniswapV2Router02 {
  function WETH() external pure returns (address);
  function factory() external pure returns (address);
  function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  ) external returns (uint amountA, uint amountB, uint liquidity);

  function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  ) external returns (uint amountA, uint amountB);

  function removeLiquidityETH(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  ) external returns (uint amountToken, uint amountETH);

  function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts);
}

interface IWETH {
  function deposit() external payable;
  function withdraw(uint) external;
}

/// @title Iggy swap router contract
/// @author Tempe Techie
/// @notice Contract that helps an Iggy frontend to swap tokens (custom because it's specific to a particular frontend)
contract IggySwapRouter is OwnableWithManagers {
  using SafeERC20 for IERC20;

  address public feeChangerAddress; // a special role that is allowed to change fees and share amounts
  address public frontendAddress; // address of a DAO/community which runs the frontend
  address public iggyAddress;
  address public routerAddress; // DEX router address
  address public stakingAddress; // staking contract address
  address public statsAddress; // stats middleware contract address
  address public immutable wethAddress;

  uint256 public constant MAX_BPS = 10_000;
  uint256 public swapFee = 80; // 0.8% default fee
  uint256 public referrerShare = 1000; // 10% share of the swap fee (in bips)
  uint256 public stakingShare = 8000; // in bips

  // after referrer & staking shares are deducted, the rest goes to the frontend operator and iggy based on the following frontendShare:
  uint256 public frontendShare = 5000; // 50% share of the swap fee in bips (after referrer & staking shares are deducted)

  // MODIFIERS
  modifier onlyFeeChanger() {
    require(msg.sender == feeChangerAddress, "IggySwap: Sender is not the Fee Changer");
    _;
  }

  // CONSTRUCTOR
  constructor(
    address _frontendAddress,
    address _iggyAddress,
    address _routerAddress,
    address _stakingAddress,
    address _statsAddress,
    uint256 _swapFee,
    uint256 _stakingShare,
    uint256 _frontendShare
  ) {
    frontendAddress = _frontendAddress;
    iggyAddress = _iggyAddress;
    routerAddress = _routerAddress;
    stakingAddress = _stakingAddress;
    statsAddress = _statsAddress;

    swapFee = _swapFee;
    stakingShare = _stakingShare;
    frontendShare = _frontendShare;

    feeChangerAddress = msg.sender;
    wethAddress = IUniswapV2Router02(_routerAddress).WETH();
  }

  // RECEIVE
  receive() external payable {}

  // READ PUBLIC/EXTERNAL

  /// @notice Get the amount of tokens and ETH to receive when removing liquidity
  /// @dev This is useful to calculate min amount of tokens and ETH, but consider reducing it by slippage on your frontend
  function calculateETHAndTokensToReceive(
    address _token, // token to receive after removing liquidity 
    uint256 _liquidity
  ) external view returns (uint256 amountToken, uint256 amountETH) {
    address factoryAddress = IUniswapV2Router02(routerAddress).factory();

    address pair = IUniswapV2Factory(factoryAddress).getPair(_token, wethAddress);

    (address token0,) = _sortTokens(_token, wethAddress);
    (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair).getReserves();
    (uint256 reserveToken, uint256 reserveETH) = _token == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    uint256 lpTotalSupply = IERC20(pair).totalSupply();

    amountToken = (reserveToken * _liquidity) / lpTotalSupply;
    amountETH = (reserveETH * _liquidity) / lpTotalSupply;
  }

  /// @notice Calculate the amount of ETH needed to add liquidity
  /// @dev This is useful to calculate min amount of ETH, but consider reducing it by slippage on your frontend
  function calculateETHForLiquidity(address addressToken, uint256 amountToken) external view returns (uint256) {
    address factoryAddress = IUniswapV2Router02(routerAddress).factory();

    address pair = IUniswapV2Factory(factoryAddress).getPair(addressToken, wethAddress);
    
    if (pair == address(0)) {
      return 0;
    }

    (address token0,) = _sortTokens(addressToken, wethAddress);
    (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair).getReserves();
    (uint256 reserveToken, uint256 reserveETH) = addressToken == token0 ? (reserve0, reserve1) : (reserve1, reserve0);

    return (amountToken * reserveETH) / reserveToken; // return amount of ETH needed to add/remove liquidity
  }

  /// @notice Preview the amount of tokens that would be received for a given swap
  function getAmountsOut(
    uint amountIn, 
    address[] memory path
  ) public view returns (uint[] memory amounts) {
    amounts = _getTokensAmountOut(amountIn, path);
    amounts[amounts.length - 1] = amounts[amounts.length - 1] - _getFeeAmount(amounts[amounts.length - 1]); // deduce swap fee from amount out
  }

  /// @notice Get LP (pair) token address for a given pair of tokens
  function getLpTokenAddress(address tokenA, address tokenB) external view returns (address) {
    if (tokenA == address(0)) {
      tokenA = wethAddress;
    }

    if (tokenB == address(0)) {
      tokenB = wethAddress;
    }

    return IUniswapV2Factory(IUniswapV2Router02(routerAddress).factory()).getPair(tokenA, tokenB);
  }

  /// @notice Calculates the price impact of a swap (in bips)
  function getPriceImpact(
    address tokenIn, 
    address tokenOut, 
    uint amountIn
  ) external view returns (uint) {
    if (tokenIn == address(0)) {
      tokenIn = wethAddress;
    }

    if (tokenOut == address(0)) {
      tokenOut = wethAddress;
    }

    if (tokenIn == tokenOut) {
      return 0;
    }

    // get factory address from router
    address factoryAddress = IUniswapV2Router02(routerAddress).factory();

    // get reserves for both tokens (reserve is a token total amount in a pool)
    (uint reserveIn, uint reserveOut) = _getReserves(factoryAddress, tokenIn, tokenOut);

    uint k = reserveIn * reserveOut; // calculate a constant k (x * y = k, standard Uniswap V2 formula)

    // calculate the amount of tokens user would receive if they swapped
    uint newReserveOut = k / (reserveIn + amountIn);

    uint amountOut = reserveOut - newReserveOut;

    return (amountOut * MAX_BPS) / newReserveOut; // return price impact in bips
  }
  
  // WRITE PUBLIC/EXTERNAL

  /// @notice Add liquidity to a pool (both tokens must be ERC-20 tokens)
  function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  ) external returns (uint amountA, uint amountB, uint liquidity) {
    // transfer tokens to this contract
    IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
    IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);

    // approve tokens to be spent by router
    IERC20(tokenA).approve(routerAddress, amountADesired);
    IERC20(tokenB).approve(routerAddress, amountBDesired);

    // add liquidity
    (amountA, amountB, liquidity) = IUniswapV2Router02(routerAddress).addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      to,
      deadline
    );
  }

  function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
    // transfer tokens to this contract
    IERC20(token).safeTransferFrom(msg.sender, address(this), amountTokenDesired);

    // approve tokens to be spent by router
    IERC20(token).approve(routerAddress, amountTokenDesired);

    // add liquidity
    (amountToken, amountETH, liquidity) = IUniswapV2Router02(routerAddress).addLiquidityETH{value: msg.value}(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      to,
      deadline
    );
  }

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  ) external returns (uint amountA, uint amountB) {
    // get factory address from router
    address factoryAddress = IUniswapV2Router02(routerAddress).factory();

    // get LP token address
    address pair = IUniswapV2Factory(factoryAddress).getPair(tokenA, tokenB);

    // transfer liquidity tokens to this contract
    IERC20(pair).safeTransferFrom(msg.sender, address(this), liquidity);

    // approve tokens to be spent by router
    IERC20(pair).approve(routerAddress, liquidity);

    // remove liquidity
    (amountA, amountB) = IUniswapV2Router02(routerAddress).removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline
    );
  }

  function removeLiquidityETH(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  ) external returns (uint amountToken, uint amountETH) {
    // get factory address from router
    address factoryAddress = IUniswapV2Router02(routerAddress).factory();

    // get LP token address
    address pair = IUniswapV2Factory(factoryAddress).getPair(token, wethAddress);

    // transfer liquidity tokens to this contract
    IERC20(pair).safeTransferFrom(msg.sender, address(this), liquidity);

    // approve tokens to be spent by router
    IERC20(pair).approve(routerAddress, liquidity);

    // remove liquidity
    (amountToken, amountETH) = IUniswapV2Router02(routerAddress).removeLiquidityETH(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline
    );
  }

  /// @notice Swap exact ERC-20 tokens for ERC-20 tokens
  function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin, // amount out deducted by slippage
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts) {
    IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // send user's tokens to this contract

    amounts = _swap(amountIn, amountOutMin, path, to, deadline, address(0), false); // no referrer
  }

  /// @notice Swap exact ERC-20 tokens for ERC-20 tokens (with referrer)
  function swapExactTokensForTokensWithReferrer(
    uint amountIn,
    uint amountOutMin, // amount out deducted by slippage
    address[] calldata path,
    address to,
    uint deadline,
    address referrer
  ) external returns (uint[] memory amounts) {
    IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // send user's tokens to this contract

    amounts = _swap(amountIn, amountOutMin, path, to, deadline, referrer, false);
  }

  /// @notice Swap exact ERC-20 tokens for ETH
  function swapExactTokensForETH(
    uint amountIn, 
    uint amountOutMin, 
    address[] memory path, 
    address to, 
    uint deadline
  ) external returns (uint[] memory amounts) {
    IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // send user's tokens to this contract

    if (path[path.length - 1] == address(0)) {
      path[path.length - 1] = wethAddress;
    }

    amounts = _swap(amountIn, amountOutMin, path, to, deadline, address(0), true); // no referrer
  }

  /// @notice Swap exact ERC-20 tokens for ETH (with referrer)
  function swapExactTokensForETHWithReferrer(
    uint amountIn, 
    uint amountOutMin, 
    address[] memory path, 
    address to, 
    uint deadline,
    address referrer
  ) external returns (uint[] memory amounts) {
    IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // send user's tokens to this contract

    if (path[path.length - 1] == address(0)) {
      path[path.length - 1] = wethAddress;
    }

    amounts = _swap(amountIn, amountOutMin, path, to, deadline, referrer, true);
  }

  /// @notice Swap exact ETH for ERC-20 tokens
  function swapExactETHForTokens(
    uint amountOutMin, 
    address[] memory path, 
    address to, 
    uint deadline
  ) external payable returns (uint[] memory amounts) {
    require(msg.value > 0, "IggySwap: Native coin amount is zero");

    IWETH(wethAddress).deposit{value: msg.value}(); // convert ETH to WETH

    if (path[0] == address(0)) {
      path[0] = wethAddress;
    }

    amounts = _swap(msg.value, amountOutMin, path, to, deadline, address(0), false); // no referrer
  }

  /// @notice Swap exact ETH for ERC-20 tokens (with referrer)
  function swapExactETHForTokensWithReferrer(
    uint amountOutMin, 
    address[] memory path, 
    address to, 
    uint deadline,
    address referrer
  ) external payable returns (uint[] memory amounts) {
    require(msg.value > 0, "IggySwap: Native coin amount is zero");

    IWETH(wethAddress).deposit{value: msg.value}(); // convert ETH to WETH

    if (path[0] == address(0)) {
      path[0] = wethAddress;
    }

    amounts = _swap(msg.value, amountOutMin, path, to, deadline, referrer, false);
  }

  // FEE CHANGER
  function changeFeeChangerAddress(address _newFeeChangerAddress) external onlyFeeChanger {
    feeChangerAddress = _newFeeChangerAddress;
  }

  function changeFrontendShare(uint256 _newFrontendShare) external onlyFeeChanger {
    require(_newFrontendShare <= MAX_BPS, "IggySwap: Frontend share is greater than MAX_BPS");
    frontendShare = _newFrontendShare;
  }

  function changeReferrerShare(uint256 _newReferrerShare) external onlyFeeChanger {
    require(_newReferrerShare <= MAX_BPS, "IggySwap: Referrer share is greater than MAX_BPS");
    referrerShare = _newReferrerShare;
  }

  function changeStakingShare(uint256 _newStakingShare) external onlyFeeChanger {
    require(_newStakingShare <= MAX_BPS, "IggySwap: Staking share is greater than MAX_BPS");
    stakingShare = _newStakingShare;
  }

  function changeSwapFee(uint256 _newSwapFee) external onlyFeeChanger {
    require(_newSwapFee <= MAX_BPS, "IggySwap: Swap fee is greater than MAX_BPS");
    swapFee = _newSwapFee;
  }

  // FRONTEND OWNER

  /// @notice Change frontend address
  function changeFrontendAddress(address _newFrontendAddress) external {
    require(msg.sender == frontendAddress, "IggySwap: Sender is not the frontend owner");
    frontendAddress = _newFrontendAddress;
  }

  // IGGY

  /// @notice Change Iggy address
  function changeIggyAddress(address _newIggyAddress) external {
    require(msg.sender == iggyAddress, "IggySwap: Sender is not Iggy");
    iggyAddress = _newIggyAddress;
  }

  // OWNER

  /// @notice Change router address
  function changeRouterAddress(address _newRouterAddress) external onlyManagerOrOwner {
    routerAddress = _newRouterAddress;
  }

  /// @notice Change staking address
  function changeStakingAddress(address _newStakingAddress) external onlyManagerOrOwner {
    stakingAddress = _newStakingAddress;
  }

  /// @notice Change stats address
  function changeStatsAddress(address _newStatsAddress) external onlyManagerOrOwner {
    statsAddress = _newStatsAddress;
  }

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyManagerOrOwner {
    IERC20(tokenAddress_).safeTransfer(recipient_, tokenAmount_);
  }

  /// @notice Recover native coins from contract
  function recoverETH() external onlyManagerOrOwner {
    (bool success, ) = owner().call{value: address(this).balance}("");
    require(success, "Failed to recover native coins from contract");
  }

  // INTERNAL - READ
  function _getFeeAmount(uint _amount) internal view returns (uint) {
    return (_amount * swapFee) / MAX_BPS;
  }

  // fetches and sorts the reserves for a pair
  function _getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
    (address token0,) = _sortTokens(tokenA, tokenB);
    address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair).getReserves();
    (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
  }

  function _getTokensAmountOut(
    uint amountIn, 
    address[] memory path
  ) internal view returns(uint[] memory amounts) {
    if (path[0] == address(0)) {
      path[0] = wethAddress;
    }

    if (path[path.length - 1] == address(0)) {
      path[path.length - 1] = wethAddress;
    }

    return IUniswapV2Router02(routerAddress).getAmountsOut(amountIn, path);
  }

  function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
    require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
    (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
  }

  // INTERNAL - WRITE
  function _swap(
    uint amountIn,
    uint amountOutMin, // amount out deducted by slippage
    address[] memory path,
    address to,
    uint deadline,
    address referrer,
    bool convertToNative
  ) internal returns (uint[] memory amounts) {
    IERC20(path[0]).approve(routerAddress, amountIn); // approve router to spend tokens

    // make the swap via router
    amounts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      address(this), // initially the receiver is this contract (tokens will be later transferred to the recipient and to fee receivers)
      deadline
    );

    uint256 _amountOut = amounts[amounts.length - 1]; // total amount out (including fee)
    uint256 _feeAmount = _getFeeAmount(_amountOut); // swap fee amount

    require((_amountOut - _feeAmount) >= amountOutMin, "IggySwap: Amount out is less than the minimum amount out");

    address tokenOut = path[path.length - 1]; // receiving token address

    // transfer tokens to the recipient (deduct the fee)
    if (convertToNative && tokenOut == wethAddress) {
      // if: tokenOut is the native coin (ETH)

      IWETH(tokenOut).withdraw(_amountOut); // convert WETH to ETH

      (bool sentWeth, ) = to.call{value: (_amountOut - _feeAmount)}("");
      require(sentWeth, "Failed to send native coins to the recipient");

      // if there's a referrer, send them a share of the fee
      uint256 referrerShareAmountNative;
      if (referrer != address(0) && referrerShare > 0) {
        referrerShareAmountNative = (_feeAmount * referrerShare) / MAX_BPS;

        (bool sentWethReferrer, ) = referrer.call{value: referrerShareAmountNative}("");
        require(sentWethReferrer, "Failed to send native coins to the referrer");

        _feeAmount -= referrerShareAmountNative; // deduct referrer's share from the fee
        if (statsAddress != address(0)) {
          IStats(statsAddress).addWeiSpent(referrer, referrerShareAmountNative); // add referrer's share to stats
        }
      }

      // if there's a staking contract, send them a share of the fee
      if (stakingAddress != address(0) && stakingShare > 0) {
        uint256 stakingShareAmountNative = (_feeAmount * stakingShare) / MAX_BPS;

        (bool sentWethStaking, ) = stakingAddress.call{value: stakingShareAmountNative}("");
        require(sentWethStaking, "Failed to send native coins to the staking contract");

        _feeAmount -= stakingShareAmountNative; // deduct staking contract's share from the fee
      }

      // send a share of the fee to the frontend operator
      if (frontendAddress != address(0) && frontendShare > 0) {
        uint256 frontendShareAmountNative = (_feeAmount * frontendShare) / MAX_BPS;
        (bool sentWethFrontend, ) = frontendAddress.call{value: frontendShareAmountNative}("");
        require(sentWethFrontend, "Failed to send native coins to the frontend operator");
      }
      
      // send the rest to Iggy
      (bool sentWethIggy, ) = iggyAddress.call{value: address(this).balance}("");
      require(sentWethIggy, "Failed to send native coins to Iggy");

      // add user's fee (without referral's share) to stats
      if (statsAddress != address(0)) {
        IStats(statsAddress).addWeiSpent(to, _feeAmount-referrerShareAmountNative);
      }
    } else {
      // else: tokenOut is NOT the native coin

      IERC20(tokenOut).safeTransfer(to, (_amountOut - _feeAmount));

        // if there's a referrer, send them a share of the fee
      if (referrer != address(0) && referrerShare > 0) {
        uint256 referrerShareAmount = (_feeAmount * referrerShare) / MAX_BPS;
        IERC20(tokenOut).safeTransfer(referrer, referrerShareAmount);
        _feeAmount -= referrerShareAmount; // deduct referrer's share from the fee
      }

      // note that staking share is not taken here, because staking contract only accepts native coins (ETH)

      if (frontendAddress != address(0) && frontendShare > 0) {
        // calculate frontend and iggy fee share amounts
        uint256 frontendShareAmount = (_feeAmount * frontendShare) / MAX_BPS;
        
        // transfer tokens to fee receivers
        IERC20(tokenOut).safeTransfer(frontendAddress, frontendShareAmount); // send part of the fee to the frontend operator
      }

      // find the remaining balance of tokenOut (to avoid leaving dust in the contract)
      uint256 tokenOutRemainingBalance = IERC20(tokenOut).balanceOf(address(this));

      // send the rest of the fee to iggy
      IERC20(tokenOut).safeTransfer(iggyAddress, tokenOutRemainingBalance);
    }
    
  }
}
