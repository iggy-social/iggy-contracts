// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";

interface IPunkTLD {
  function balanceOf(address) external view returns (uint256);
  function idCounter() external view returns (uint256);
}

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
  function weiSpentTotal() external view returns (uint256);
}

/** 
@title Collect all wei spending stats from different contracts and return them as one
@author Tempe Techie
*/
contract ActivityPointsScrolly is OwnableWithManagers {
  address public statsAddress; // stats for NFT launchpad, Friend Keys, Swap etc.
  address public mintedPostsStatsAddress;
  address public immutable tldAddress;

  uint256 public domainsOwnedLimit = 3;
  uint256 public multiplier = 1_000_000; // multiplier for points (e.g. 1 means 1 wei spent = 1 point)
  uint256 public multiplierOtherActions = 5; // multiplier for launchpad, keys, swap etc. actions
  uint256 public weiPerDomain = 169000000000000;

  mapping (address => uint256) public bonusWei; // bonus wei (without multiplier)

  // EVENTS
  event BonusPointsAdded(address indexed manager_, address indexed user_, uint256 bp_);
  event BonusPointsRemoved(address indexed manager_, address indexed user_, uint256 bp_);
  event BonusWeiAdded(address indexed manager_, address indexed user_, uint256 bw_);
  event BonusWeiRemoved(address indexed manager_, address indexed user_, uint256 bw_);

  constructor(
    address _statsAddress,
    address _mintedPostsStatsAddress,
    address _tldAddress
  ) {
    statsAddress = _statsAddress;
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
    tldAddress = _tldAddress;
  }

  // READ

  /// @notice This function returns only the bonus points, not all points (for all points check getPoints(address))
  function getBonusPoints(address _user) external view returns (uint256) {
    return bonusWei[_user] * multiplier;
  }

  /// @notice This function returns only the bonus wei, not all wei spent
  function getBonusWei(address _user) external view returns (uint256) {
    return bonusWei[_user];
  }

  /// @notice This is the MAIN VIEW FUNCTION to get all points of a given user; points = (bonus wei + wei spent) * multiplier
  function getPoints(address user_) external view returns (uint256) {
    return (bonusWei[user_] + getTotalWeiSpent(user_)) * multiplier;
  }

  /// @notice This function returns the total wei spent by a user, without a multiplier and without bonus wei
  function getTotalWeiSpent(address _user) public view returns (uint256) {
    uint256 totalWeiSpent;

    if (statsAddress != address(0)) {
      totalWeiSpent += (IStats(statsAddress).getWeiSpent(_user) * multiplierOtherActions);
    }
    
    if (mintedPostsStatsAddress != address(0)) {
      totalWeiSpent += IStats(mintedPostsStatsAddress).getWeiSpent(_user);
    }

    if (tldAddress == address(0)) {
      return totalWeiSpent;
    }

    // check how many domains the user owns
    uint256 domainsOwned = IPunkTLD(tldAddress).balanceOf(_user);

    if (domainsOwned > domainsOwnedLimit) {
      domainsOwned = domainsOwnedLimit;
    }

    totalWeiSpent += (domainsOwned * weiPerDomain);

    return totalWeiSpent;
  }

  // OWNER OR MANAGER

  /// @notice These points already include the multiplier
  function addBonusPoints(address _user, uint256 _bp) external onlyManagerOrOwner {
    bonusWei[_user] += _bp / multiplier;
    emit BonusPointsAdded(msg.sender, _user, _bp);
  }

  /// @notice These points already include the multiplier
  function removeBonusPoints(address _user, uint256 _bp) external onlyManagerOrOwner {
    require(bonusWei[_user] >= _bp / multiplier, "ActivityPoints: not enough bonus points");
    bonusWei[_user] -= _bp / multiplier;
    emit BonusPointsRemoved(msg.sender, _user, _bp);
  }

  /// @notice Bonus wei does not include the multiplier
  function addBonusWei(address _user, uint256 _wei) external onlyManagerOrOwner {
    bonusWei[_user] += _wei;
    emit BonusWeiAdded(msg.sender, _user, _wei);
  }

  /// @notice Bonus wei does not include the multiplier
  function removeBonusWei(address _user, uint256 _wei) external onlyManagerOrOwner {
    require(bonusWei[_user] >= _wei, "ActivityPoints: not enough bonus wei");
    bonusWei[_user] -= _wei;
    emit BonusWeiRemoved(msg.sender, _user, _wei);
  }

  function setDomainsOwnedLimit(uint256 _domainsOwnedLimit) external onlyManagerOrOwner {
    domainsOwnedLimit = _domainsOwnedLimit;
  }

  function setMintedPostsStatsAddress(address _mintedPostsStatsAddress) external onlyManagerOrOwner {
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
  }

  function setMultiplier(uint256 _multiplier) external onlyManagerOrOwner {
    multiplier = _multiplier;
  }

  function setMultiplierOtherActions(uint256 _multiplierOtherActions) external onlyManagerOrOwner {
    multiplierOtherActions = _multiplierOtherActions;
  }

  function setStatsAddress(address _statsAddress) external onlyManagerOrOwner {
    statsAddress = _statsAddress;
  }

  function setWeiPerDomain(uint256 _weiPerDomain) external onlyManagerOrOwner {
    weiPerDomain = _weiPerDomain;
  }
  
}