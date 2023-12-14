// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
  function weiSpentTotal() external view returns (uint256);
}

/** 
@title Collect all wei spending stats from different contracts and return them as one
@author Tempe Techie
*/
contract ActivityPoints is OwnableWithManagers {
  address public keyStatsAddress;
  address public mintedPostsStatsAddress;
  address public nftStatsAddress;
  address public swapStatsAddress;
  address public tldStatsAddress;

  uint256 public bonusPointsTotal; // total bonus points in wei

  mapping (address => uint256) public bonusPoints; // bonus points in wei

  // EVENTS
  event BonusPointsAdded(address indexed manager_, address indexed user_, uint256 wei_);
  event BonusPointsRemoved(address indexed manager_, address indexed user_, uint256 wei_);

  constructor(
    address _keyStatsAddress,
    address _mintedPostsStatsAddress,
    address _nftStatsAddress,
    address _swapStatsAddress,
    address _tldStatsAddress
  ) {
    keyStatsAddress = _keyStatsAddress;
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
    nftStatsAddress = _nftStatsAddress;
    swapStatsAddress = _swapStatsAddress;
    tldStatsAddress = _tldStatsAddress;
  }

  // READ

  function getTotalWeiSpent(address _user) external view returns (uint256) {
    uint256 totalWeiSpent = bonusPoints[_user];

    if (keyStatsAddress != address(0)) {
      totalWeiSpent += IStats(keyStatsAddress).getWeiSpent(_user);
    }
    
    if (mintedPostsStatsAddress != address(0)) {
      totalWeiSpent += IStats(mintedPostsStatsAddress).getWeiSpent(_user);
    }

    if (nftStatsAddress != address(0)) {
      totalWeiSpent += IStats(nftStatsAddress).getWeiSpent(_user);
    }

    if (swapStatsAddress != address(0)) {
      totalWeiSpent += IStats(swapStatsAddress).getWeiSpent(_user);
    }

    if (tldStatsAddress != address(0)) {
      totalWeiSpent += IStats(tldStatsAddress).getWeiSpent(_user);
    }

    return totalWeiSpent;
  }

  function getTotalWeiSpentAllUsers() external view returns (uint256) {
    uint256 totalWeiSpent = bonusPointsTotal;

    if (keyStatsAddress != address(0)) {
      totalWeiSpent += IStats(keyStatsAddress).weiSpentTotal();
    }
    
    if (mintedPostsStatsAddress != address(0)) {
      totalWeiSpent += IStats(mintedPostsStatsAddress).weiSpentTotal();
    }

    if (nftStatsAddress != address(0)) {
      totalWeiSpent += IStats(nftStatsAddress).weiSpentTotal();
    }

    if (swapStatsAddress != address(0)) {
      totalWeiSpent += IStats(swapStatsAddress).weiSpentTotal();
    }

    if (tldStatsAddress != address(0)) {
      totalWeiSpent += IStats(tldStatsAddress).weiSpentTotal();
    }

    return totalWeiSpent;
  }

  // OWNER

  function addBonusPoints(address _user, uint256 _wei) external onlyManagerOrOwner {
    bonusPoints[_user] += _wei;
    bonusPointsTotal += _wei;
    emit BonusPointsAdded(msg.sender, _user, _wei);
  }

  function removeBonusPoints(address _user, uint256 _wei) external onlyManagerOrOwner {
    bonusPoints[_user] -= _wei;
    bonusPointsTotal -= _wei;
    emit BonusPointsRemoved(msg.sender, _user, _wei);
  }

  function setKeyStatsAddress(address _keyStatsAddress) external onlyManagerOrOwner {
    keyStatsAddress = _keyStatsAddress;
  }

  function setMintedPostsStatsAddress(address _mintedPostsStatsAddress) external onlyManagerOrOwner {
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
  }

  function setNftStatsAddress(address _nftStatsAddress) external onlyManagerOrOwner {
    nftStatsAddress = _nftStatsAddress;
  }

  function setSwapStatsAddress(address _swapStatsAddress) external onlyManagerOrOwner {
    swapStatsAddress = _swapStatsAddress;
  }

  function setTldStatsAddress(address _tldStatsAddress) external onlyManagerOrOwner {
    tldStatsAddress = _tldStatsAddress;
  }
  
}