// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC20, ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ChatToken is ERC20Burnable, Ownable, ERC20Permit {
  address public minter;

  // CONSTRUCTOR
  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) ERC20Permit(_name) {}

  // EVENTS
  event MinterAddressChanged(address indexed _owner, address indexed _minter);

  // MINTER

  function mint(address _to, uint256 _amount) external {
    require(msg.sender == minter, "ChatToken: only minter can mint");
    _mint(_to, _amount);
  }

  // OWNER

  function setMinter(address _minter) external onlyOwner {
    minter = _minter;
    emit MinterAddressChanged(msg.sender, _minter);
  }

}
