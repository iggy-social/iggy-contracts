// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IChatToken is IERC20 {
  function mint(address to, uint256 amount) external;
}

contract ChatTokenMinter is Ownable {
  address public immutable chatToken;
  bool public paused = false;
  
  mapping(address => bool) public isMinter; // addresses that have minting privileges

  // CONSTRUCTOR
  constructor(address _chatToken) {
    chatToken = _chatToken;
  }

  // MINTER

  function mint(address _to, uint256 _amount) external {
    require(!paused, "ChatTokenMinter: minting is paused");
    require(isMinter[msg.sender], "ChatTokenMinter: only minters can mint");

    IChatToken(chatToken).mint(_to, _amount);
  }

  // OWNER

  function addMinter(address _minter) external onlyOwner {
    isMinter[_minter] = true;
  }

  function removeMinter(address _minter) external onlyOwner {
    isMinter[_minter] = false;
  }

  function togglePaused() external onlyOwner {
    paused = !paused;
  }
}