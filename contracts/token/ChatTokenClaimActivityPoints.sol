// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IChatTokenMinter is IERC20 {
  function mint(address to, uint256 amount) external;
}

interface IActivityPoints {
  function getTotalWeiSpent(address _address) external view returns (uint256);
}

/**
@title Chat Token Claim For Activity Points
@notice Smart contract for claiming chat tokens earned via activity points.
*/
contract ChatTokenClaimActivityPoints is Ownable {
  address public immutable chatTokenMinter;
  address public immutable apAddress; // activity points smart contract address

  bool public paused = false;

  uint256 public immutable chatEthRatio; // for example, 1000: 1 ETH = 1,000 CHAT
  
  mapping(address => bool) public hasClaimed; // addresses that have already claimed

  // CONSTRUCTOR
  constructor(
    address _chatTokenMinter, 
    address _apAddress, 
    uint256 _chatEthRatio 
  ) {
    require(_chatEthRatio > 0, "ChatTokenClaimActivityPoints: chatEthRatio must be greater than 0");
    require(_chatTokenMinter != address(0), "ChatTokenClaimActivityPoints: chatTokenMinter cannot be zero address");
    require(_apAddress != address(0), "ChatTokenClaimActivityPoints: apAddress cannot be zero address");

    chatTokenMinter = _chatTokenMinter;
    apAddress = _apAddress;
    chatEthRatio = _chatEthRatio;
  }

  // READ

  function claimPreview(address _address) public view returns (uint256) {
    if (hasClaimed[_address]) return 0; // already claimed

    uint256 _mintedWei = IActivityPoints(apAddress).getTotalWeiSpent(_address);
    return _mintedWei * chatEthRatio;
  }

  // WRITE

  function claim() external {
    require(!paused, "ChatTokenClaimActivityPoints: claiming is paused");
    require(!hasClaimed[msg.sender], "ChatTokenClaimActivityPoints: user already claimed");

    uint256 _claimAmount = claimPreview(msg.sender);
    require(_claimAmount > 0, "ChatTokenClaimActivityPoints: no tokens to claim");

    hasClaimed[msg.sender] = true; // mark as claimed
    IChatTokenMinter(chatTokenMinter).mint(msg.sender, _claimAmount);
  }

  // OWNER

  function togglePaused() external onlyOwner {
    paused = !paused;
  }
}