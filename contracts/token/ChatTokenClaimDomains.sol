// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IChatTokenMinter is IERC20 {
  function mint(address to, uint256 amount) external;
}

interface IBasePunkTLD {
  function getDomainHolder(string calldata _domainName) external view returns(address);
}

/**
@title Chat Token Claim For Domain Holders
@notice Airdrop for domain holders
*/
contract ChatTokenClaimDomains is Ownable {
  address public immutable chatTokenMinter;
  address public immutable domainAddress; // address of the punk domain smart contract

  bool public paused = false;

  uint256 public immutable chatReward; // how many tokens a domain gets
  
  mapping(string => bool) public hasClaimed; // domain names that have already claimed

  // CONSTRUCTOR
  constructor(
    address _chatTokenMinter, 
    address _domainAddress, 
    uint256 _chatReward 
  ) {
    require(_chatReward > 0, "ChatTokenClaimPostMinters: chatReward must be greater than 0");
    require(_chatTokenMinter != address(0), "ChatTokenClaimPostMinters: chatTokenMinter cannot be zero address");
    require(_domainAddress != address(0), "ChatTokenClaimPostMinters: domain contract cannot be zero address");

    chatTokenMinter = _chatTokenMinter;
    domainAddress = _domainAddress;
    chatReward = _chatReward;
  }

  // WRITE

  /**
  @notice Claim chat tokens for a domain name. Anyone can claim for any domain name, but only holder gets the tokens.
  */
  function claim(string calldata _domainName) external {
    require(!paused, "ChatTokenClaimPostMinters: claiming is paused");
    require(!hasClaimed[_domainName], "ChatTokenClaimPostMinters: already claimed");

    address _domainHolder = IBasePunkTLD(domainAddress).getDomainHolder(_domainName);
    require(_domainHolder != address(0), "ChatTokenClaimPostMinters: domain holder cannot be zero address");

    hasClaimed[_domainName] = true; // mark as claimed
    IChatTokenMinter(chatTokenMinter).mint(_domainHolder, chatReward);
  }

  // OWNER

  function togglePaused() external onlyOwner {
    paused = !paused;
  }
}