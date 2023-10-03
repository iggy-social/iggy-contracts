// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
}

contract ActivityPoints is Ownable {
  address public keyStatsAddress;
  address public mintedPostsStatsAddress;
  address public nftStatsAddress;
  address public tldStatsAddress;

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

    if (keyStatsAddress != address(0)) {
      totalWeiSpent += IStats(keyStatsAddress).getWeiSpent(_user);
    }
    
    if (mintedPostsStatsAddress != address(0)) {
      totalWeiSpent += IStats(mintedPostsStatsAddress).getWeiSpent(_user);
    }

    if (nftStatsAddress != address(0)) {
      totalWeiSpent += IStats(nftStatsAddress).getWeiSpent(_user);
    }

    if (tldStatsAddress != address(0)) {
      totalWeiSpent += IStats(tldStatsAddress).getWeiSpent(_user);
    }

    return totalWeiSpent;
  }

  // OWNER

  function setKeyStatsAddress(address _keyStatsAddress) external onlyOwner {
    keyStatsAddress = _keyStatsAddress;
  }

  function setMintedPostsStatsAddress(address _mintedPostsStatsAddress) external onlyOwner {
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
  }

  function setNftStatsAddress(address _nftStatsAddress) external onlyOwner {
    nftStatsAddress = _nftStatsAddress;
  }

  function setTldStatsAddress(address _tldStatsAddress) external onlyOwner {
    tldStatsAddress = _tldStatsAddress;
  }
  
}