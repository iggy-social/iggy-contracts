// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Iggy swap general contract
/// @author Tempe Techie
/// @notice Contract that helps any frontend to swap tokens and earn a fee (general because it's NOT specific to a particular DAO)
contract IggySwapGeneral is Ownable {
  address public iggyAddress;
  address public routerAddress; // DEX router address
  address public immutable wethAddress;

  uint256 public constant MAX_BPS = 10_000;
  uint256 public swapFee = 80; // 0.8% default fee
  uint256 public referrerShare = 1000; // 10% share of the swap fee
  uint256 public frontendShare = 5000; // 50% share of the swap fee (after referrer share is deducted)

  constructor(
    address _iggyAddress,
    address _routerAddress,
    address _wethAddress
  ) {
    iggyAddress = _iggyAddress;
    routerAddress = _routerAddress;
    wethAddress = _wethAddress;
  }

  // TODO: READ
  // TODO: WRITE

  // OWNER
  function changeReferrerShare(uint256 _newReferrerShare) external onlyOwner {
    require(_newReferrerShare <= MAX_BPS, "IggySwapHelper: Referrer share is greater than MAX_BPS");
    referrerShare = _newReferrerShare;
  }

  function changeFrontendShare(uint256 _newFrontendShare) external onlyOwner {
    require(_newFrontendShare <= MAX_BPS, "IggySwapHelper: Frontend share is greater than MAX_BPS");
    frontendShare = _newFrontendShare;
  }

  function changeSwapFee(uint256 _newSwapFee) external onlyOwner {
    require(_newSwapFee <= MAX_BPS, "IggySwapHelper: Swap fee is greater than MAX_BPS");
    swapFee = _newSwapFee;
  }

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
