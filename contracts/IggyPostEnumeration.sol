// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Iggy post enumeration contract
/// @author Tempe Techie
/// @notice Contract that keeps track of who minted which Iggy Post IDs
contract IggyPostEnumeration is Ownable {
  address public minterAddress;

  mapping (address => uint256[]) public getMintedPostIds; // user => postIds; get a list of post IDs minted by a user
  mapping (address => uint256) public getMintedWei; // user => wei; get the total amount of wei paid for minting posts by a user

  // EVENTS
  event MinterAddressChanged(address indexed user, address minterAddress);

  // constructor
  constructor(address _minterAddress) {
    minterAddress = _minterAddress;
  }

  // WRITE

  function addMintedPostId(address _user, uint256 _postId) external {
    require(_msgSender() == minterAddress, "IggyPostMetadata: Only minter can add minted post ID");
    getMintedPostIds[_user].push(_postId);
  }

  function addMintedWei(address _user, uint256 _wei) external {
    require(_msgSender() == minterAddress, "IggyPostMetadata: Only minter can add minted wei");
    getMintedWei[_user] += _wei;
  }

  // OWNER

  function setMinterAddress(address _minterAddress) external onlyOwner {
    minterAddress = _minterAddress;
    emit MinterAddressChanged(_msgSender(), _minterAddress);
  }

  // RECOVERY

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
}