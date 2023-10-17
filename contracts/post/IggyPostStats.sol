// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Iggy post stats contract
/// @author Tempe Techie
/// @notice Contract that keeps track of who minted which Iggy Post IDs
contract IggyPostStats is OwnableWithManagers {
  address public minterAddress;
  uint256 public weiSpentTotal; // total wei spent

  mapping (address => uint256[]) public getMintedPostIds; // user => postIds; get a list of post IDs minted by a user
  mapping (address => uint256) public getMintedWei; // user => wei; get the total amount of wei paid for minting posts by a user
  mapping (uint256 => uint256) public weiEarnedByAuthorPerPostId; // postId => wei; get the total amount of wei earned by author for a given post ID
  mapping (uint256 => uint256) public postMintedCounter; // postId => counter; get the number of times a post has been minted

  // EVENTS
  event MinterAddressChanged(address indexed user, address minterAddress);

  // constructor
  constructor(address _minterAddress) {
    minterAddress = _minterAddress;
  }

  // READ

  // get minted post IDs array
  function getMintedPostIdsArray(address _user) external view returns (uint256[] memory) {
    return getMintedPostIds[_user];
  }

  // get minted post IDs length
  function getMintedPostIdsLength(address _user) external view returns (uint256) {
    return getMintedPostIds[_user].length;
  }

  function getWeiEarnedByAuthorPerPostId(uint256 _postId) external view returns (uint256) {
    return weiEarnedByAuthorPerPostId[_postId];
  }

  function getWeiSpent(address user_) external view returns (uint256) {
    return getMintedWei[user_];
  }

  // WRITE

  function addMintedPostId(address _user, uint256 _postId) external {
    require(_msgSender() == minterAddress, "IggyPostStats: Only minter can add minted post ID");
    getMintedPostIds[_user].push(_postId);
    postMintedCounter[_postId] += 1;
  }

  function addMintedWei(address _user, uint256 _wei) external {
    require(_msgSender() == minterAddress, "IggyPostStats: Only minter can add minted wei");
    getMintedWei[_user] += _wei;
    weiSpentTotal += _wei;
  }

  function addWeiEarnedByAuthorPerPostId(uint256 _postId, uint256 _wei) external {
    require(_msgSender() == minterAddress, "IggyPostStats: Only minter can add wei earned by author per post ID");
    weiEarnedByAuthorPerPostId[_postId] += _wei;
  }

  // OWNER

  function setMinterAddress(address _minterAddress) external onlyManagerOrOwner {
    minterAddress = _minterAddress;
    emit MinterAddressChanged(_msgSender(), _minterAddress);
  }

  // RECOVERY

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyManagerOrOwner {
    IERC20(tokenAddress_).transfer(recipient_, tokenAmount_);
  }

  /// @notice Withdraw native coins from contract
  function withdraw() external onlyManagerOrOwner {
    (bool success, ) = owner().call{value: address(this).balance}("");
    require(success, "Failed to withdraw native coins from contract");
  }
}