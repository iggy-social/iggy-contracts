// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router02 {
  function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);

  function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external payable;

  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external;
}

/// @title Iggy swap helper contract
/// @author Tempe Techie
/// @notice Contract that helps an Iggy frontend to swap tokens
contract IggySwapHelper is Ownable {
  address public daoAddress; // address of a DAO/community which runs the frontend
  address public iggyAddress;
  address public routerAddress; // DEX router address
  address public feeChangerAddress; // a special role that is allowed to change fees and share amounts
  address public immutable wethAddress;

  uint256 public constant MAX_BPS = 10_000;
  uint256 public swapFee = 80; // 0.8% default fee
  uint256 public referrerShare = 1000; // 10% share of the swap fee
  uint256 public daoShare = 5000; // 50% share of the swap fee (after referrer share is deducted)

  constructor(
    address _daoAddress,
    address _iggyAddress,
    address _routerAddress,
    address _wethAddress
  ) {
    daoAddress = _daoAddress;
    iggyAddress = _iggyAddress;
    routerAddress = _routerAddress;
    feeChangerAddress = _msgSender();
    wethAddress = _wethAddress;
  }

  // MODIFIERS
  modifier onlyFeeChanger() {
    require(_msgSender() == feeChangerAddress, "IggySwapHelper: Sender is not the Fee Changer");
    _;
  }

  // INTERNAL
  function _getTokensAmountOut(
    uint amountIn, 
    address[] memory path
  ) internal view returns(uint[] memory amounts) {
    if (path[0] == address(0)) {
      path[0] = wethAddress;
    }

    if (path[1] == address(0)) {
      path[1] = wethAddress;
    }

    return IUniswapV2Router02(routerAddress).getAmountsOut(amountIn, path);
  }

  // READ
  function getAmountsOut(
    uint amountIn, 
    address[] memory path
  ) public view returns (uint[] memory amounts) {
    amounts = _getTokensAmountOut(amountIn, path);
    amounts[1] = amounts[1] - ((amounts[1] * swapFee) / MAX_BPS); // deduce swap fee from amount out
  }

  // WRITE
  /*
  // without refrerrer
  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external {}

  // with referrer
  function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline,
    address referrer
  ) external {}

  // without referrer
  function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external payable {}

  // with referrer
  function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline,
    address referrer
  ) external payable {}
  */

  // FEE CHANGER
  function changeFeeChangerAddress(address _newFeeChangerAddress) external onlyFeeChanger {
    feeChangerAddress = _newFeeChangerAddress;
  }

  function changeReferrerShare(uint256 _newReferrerShare) external onlyFeeChanger {
    referrerShare = _newReferrerShare;
  }

  function changeDaoShare(uint256 _newDaoShare) external onlyFeeChanger {
    daoShare = _newDaoShare;
  }

  function changeSwapFee(uint256 _newSwapFee) external onlyFeeChanger {
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
