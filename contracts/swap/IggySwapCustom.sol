// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router02 {
  function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);

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

/// @title Iggy swap custom contract
/// @author Tempe Techie
/// @notice Contract that helps an Iggy frontend to swap tokens (custom because it's specific to a particular frontend)
contract IggySwapCustom is Ownable {
  address public frontendAddress; // address of a DAO/community which runs the frontend
  address public iggyAddress;
  address public routerAddress; // DEX router address
  address public feeChangerAddress; // a special role that is allowed to change fees and share amounts
  address public immutable wethAddress;

  uint256 public constant MAX_BPS = 10_000;
  uint256 public swapFee = 80; // 0.8% default fee
  uint256 public referrerShare = 1000; // 10% share of the swap fee
  uint256 public frontendShare = 5000; // 50% share of the swap fee (after referrer share is deducted)

  constructor(
    address _frontendAddress,
    address _iggyAddress,
    address _routerAddress,
    address _wethAddress
  ) {
    frontendAddress = _frontendAddress;
    iggyAddress = _iggyAddress;
    routerAddress = _routerAddress;
    feeChangerAddress = _msgSender();
    wethAddress = _wethAddress;
  }

  // MODIFIERS
  modifier onlyFeeChanger() {
    require(_msgSender() == feeChangerAddress, "IggySwap: Sender is not the Fee Changer");
    _;
  }

  // READ INTERNAL
  function _getFeeAmount(uint _amount) internal view returns (uint) {
    return (_amount * swapFee) / MAX_BPS;
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

  // READ PUBLIC/EXTERNAL
  function getAmountsOut(
    uint amountIn, 
    address[] memory path
  ) public view returns (uint[] memory amounts) {
    amounts = _getTokensAmountOut(amountIn, path);
    amounts[amounts.length - 1] = amounts[amounts.length - 1] - _getFeeAmount(amounts[amounts.length - 1]); // deduce swap fee from amount out
  }

  // WRITE INTERNAL
  function _swap(
    uint amountIn,
    uint amountOutMin, // amount out deducted by slippage
    address[] memory path,
    address to,
    uint deadline,
    address referrer,
    bool convertToNative
  ) internal  returns (uint[] memory amounts) {
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
      IWETH(tokenOut).withdraw(_amountOut - _feeAmount);
      (bool sentWeth, ) = payable(to).call{value: (_amountOut - _feeAmount)}("");
      require(sentWeth, "Failed to send native coins to the recipient");
    } else {
      IERC20(tokenOut).transfer(to, (_amountOut - _feeAmount));
    }

    // if there's a referrer, send them a share of the fee
    if (referrer != address(0) && referrerShare > 0) {
      uint256 referrerShareAmount = (_feeAmount * referrerShare) / MAX_BPS;
      IERC20(tokenOut).transfer(referrer, referrerShareAmount);
      _feeAmount -= referrerShareAmount; // deduct referrer's share from the fee
    }

    // calculate frontend and iggy fee share amounts
    uint256 frontendShareAmount = (_feeAmount * frontendShare) / MAX_BPS;
    uint256 iggyShareAmount = (_feeAmount * (MAX_BPS - frontendShare)) / MAX_BPS;

    // transfer tokens to fee receivers
    IERC20(tokenOut).transfer(frontendAddress, frontendShareAmount); // send part of the fee to the frontend operator
    IERC20(tokenOut).transfer(iggyAddress, iggyShareAmount); // send part of the fee to iggy
  }
  
  // WRITE PUBLIC/EXTERNAL

  /// @notice Swap exact ERC-20 tokens for ERC-20 tokens
  function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin, // amount out deducted by slippage
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts) {
    IERC20(path[0]).transferFrom(_msgSender(), address(this), amountIn); // send user's tokens to this contract

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
    IERC20(path[0]).transferFrom(_msgSender(), address(this), amountIn); // send user's tokens to this contract

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
    IERC20(path[0]).transferFrom(_msgSender(), address(this), amountIn); // send user's tokens to this contract

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
    IERC20(path[0]).transferFrom(_msgSender(), address(this), amountIn); // send user's tokens to this contract

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

  function changeReferrerShare(uint256 _newReferrerShare) external onlyFeeChanger {
    require(_newReferrerShare <= MAX_BPS, "IggySwap: Referrer share is greater than MAX_BPS");
    referrerShare = _newReferrerShare;
  }

  function changeFrontendShare(uint256 _newFrontendShare) external onlyFeeChanger {
    require(_newFrontendShare <= MAX_BPS, "IggySwap: Frontend share is greater than MAX_BPS");
    frontendShare = _newFrontendShare;
  }

  function changeSwapFee(uint256 _newSwapFee) external onlyFeeChanger {
    require(_newSwapFee <= MAX_BPS, "IggySwap: Swap fee is greater than MAX_BPS");
    swapFee = _newSwapFee;
  }

  // OWNER
  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyOwner {
    IERC20(tokenAddress_).transfer(recipient_, tokenAmount_);
  }

  /// @notice Recover any ERC-721 token mistakenly sent to this contract address
  function recoverERC721(address tokenAddress_, uint256 tokenId_, address recipient_) external onlyOwner {
    IERC721(tokenAddress_).transferFrom(address(this), recipient_, tokenId_);
  }

  /// @notice Recover any ERC-1155 token mistakenly sent to this contract address
  function recoverERC1155(address tokenAddress_, uint256 tokenId_, address recipient_, uint256 _amount) external onlyOwner {
    IERC1155(tokenAddress_).safeTransferFrom(address(this), recipient_, tokenId_, _amount, "");
  }

  /// @notice Recover native coins from contract
  function recoverETH() external onlyOwner {
    (bool success, ) = payable(owner()).call{value: address(this).balance}("");
    require(success, "Failed to recover native coins from contract");
  }

  // RECEIVE & FALLBACK
  receive() external payable {}
  fallback() external payable {}
}
