// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";

interface INFT {
  function balanceOf(address account) external view returns (uint256);
}

interface IStats {
  function getWeiSpent(address user_) external view returns (uint256);
}

/** 
@title Collect all wei spending stats from different contracts and return them as one
@author Tempe Techie
*/
contract ActivityPointsBasePunk is OwnableWithManagers {
  address public immutable basePunkNftAddress = 0x89290b2FaD76bF4a6Ed9D8066f644d45530FA920; // basePunk NFT contract address

  address public keyStatsAddress;
  address public mintedPostsStatsAddress;
  address public nftStatsAddress; // NFT launchpad
  address public tldStatsAddress;

  uint256 public multiplier = 10_000; // multiplier for points
  uint256 public multiplierNft = 10; // multiplier for NFT holders

  mapping (address => uint256) public bonusWei; // bonus wei (without multiplier)

  // EVENTS
  event BonusPointsAdded(address indexed manager_, address indexed user_, uint256 bp_);
  event BonusPointsRemoved(address indexed manager_, address indexed user_, uint256 bp_);

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

  function getPoints(address user_) external view returns (uint256) {
    uint256 nftMultiplier = 1;

    if (INFT(basePunkNftAddress).balanceOf(user_) > 0) {
      nftMultiplier = multiplierNft;
    }

    return (bonusWei[user_] + getTotalWeiSpent(user_)) * multiplier * nftMultiplier;
  }

  function getTotalWeiSpent(address _user) public view returns (uint256) {
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
  }

  /// @notice Bonus wei does not include the multiplier
  function removeBonusWei(address _user, uint256 _wei) external onlyManagerOrOwner {
    require(bonusWei[_user] >= _wei, "ActivityPoints: not enough bonus wei");
    bonusWei[_user] -= _wei;
  }

  function setKeyStatsAddress(address _keyStatsAddress) external onlyManagerOrOwner {
    keyStatsAddress = _keyStatsAddress;
  }

  function setMintedPostsStatsAddress(address _mintedPostsStatsAddress) external onlyManagerOrOwner {
    mintedPostsStatsAddress = _mintedPostsStatsAddress;
  }

  function setMultiplier(uint256 _multiplier) external onlyManagerOrOwner {
    multiplier = _multiplier;
  }

  function setNftMultiplier(uint256 _multiplierNft) external onlyManagerOrOwner {
    multiplierNft = _multiplierNft;
  }

  function setNftStatsAddress(address _nftStatsAddress) external onlyManagerOrOwner {
    nftStatsAddress = _nftStatsAddress;
  }

  function setTldStatsAddress(address _tldStatsAddress) external onlyManagerOrOwner {
    tldStatsAddress = _tldStatsAddress;
  }
  
}