// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
}

contract ActivityPoints {
  address public immutable keyStatsAddress;
  address public immutable mintedPostsStatsAddress;
  address public immutable nftStatsAddress;
  address public immutable tldStatsAddress;

  constructor(
    address _keyStatsAddress,
    address _mintedPostsStatsAddress,
    address _nftStatsAddress,
    address _tldStatsAddress
  ) {
    keyStatsAddress = _keyStatsAddress;
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
    nftStatsAddress = _nftStatsAddress;
    tldStatsAddress = _tldStatsAddress;
  }

  // READ
  function getTotalWeiSpent(address _user) external view returns (uint256) {
    uint256 totalWeiSpent = 0;
    totalWeiSpent += IStats(keyStatsAddress).getWeiSpent(_user);
    totalWeiSpent += IStats(mintedPostsStatsAddress).getWeiSpent(_user);
    totalWeiSpent += IStats(nftStatsAddress).getWeiSpent(_user);
    totalWeiSpent += IStats(tldStatsAddress).getWeiSpent(_user);
    return totalWeiSpent;
  }
  
}