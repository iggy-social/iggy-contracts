// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IChatTokenMinter is IERC20 {
  function mint(address to, uint256 amount) external;
}

interface IIggyPostEnumeration {
  function getMintedWei(address _address) external view returns (uint256);
}

/**
@title Chat Token Claim For Post Minters
@notice Smart contract for claiming chat tokens earned with post minting before the chat token contract was live.
*/
contract ChatTokenClaimPostMinters is Ownable {
  address public immutable chatTokenMinter;
  address public immutable iggyPostEnumeration;

  bool public paused = false;

  uint256 public immutable chatEthRatio; // for example, 1000: 1 ETH (or post minting payment coin) = 1,000 CHAT
  
  mapping(address => bool) public hasClaimed; // addresses that have already claimed

  // CONSTRUCTOR
  constructor(
    address _chatTokenMinter, 
    address _iggyPostEnumeration, 
    uint256 _chatEthRatio 
  ) {
    require(_chatEthRatio > 0, "ChatTokenClaimPostMinters: chatEthRatio must be greater than 0");
    require(_chatTokenMinter != address(0), "ChatTokenClaimPostMinters: chatTokenMinter cannot be zero address");
    require(_iggyPostEnumeration != address(0), "ChatTokenClaimPostMinters: iggyPostEnumeration cannot be zero address");

    chatTokenMinter = _chatTokenMinter;
    iggyPostEnumeration = _iggyPostEnumeration;
    chatEthRatio = _chatEthRatio;
  }

  // WRITE

  function claim() external {
    require(!paused, "ChatTokenClaimPostMinters: claiming is paused");
    require(!hasClaimed[_msgSender()], "ChatTokenClaimPostMinters: already claimed");

    uint256 _mintedWei = IIggyPostEnumeration(iggyPostEnumeration).getMintedWei(_msgSender());
    require(_mintedWei > 0, "ChatTokenClaimPostMinters: no tokens to claim");

    hasClaimed[_msgSender()] = true; // mark as claimed
    IChatTokenMinter(chatTokenMinter).mint(_msgSender(), (_mintedWei * chatEthRatio));
  }

  // OWNER

  function togglePaused() external onlyOwner {
    paused = !paused;
  }
}