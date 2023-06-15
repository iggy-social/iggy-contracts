// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC20, ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Votes, ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MockErc20TokenVotingBlock is ERC20Burnable, Ownable, ERC20Votes {

  // CONSTRUCTOR
  constructor (
    string memory _name, 
    string memory _symbol
  ) ERC20(_name, _symbol) ERC20Permit(_name) {}

  // MINTER

  function mint(address _to, uint256 _amount) external {
    _mint(_to, _amount);
  }

  function _afterTokenTransfer(
    address from, 
    address to, 
    uint256 amount
  ) internal override(ERC20, ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._burn(account, amount);
  }

}
