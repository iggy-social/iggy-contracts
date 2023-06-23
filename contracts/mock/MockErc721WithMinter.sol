// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MockErc721WithMinter is ERC721, Ownable {
  address public minterAddress;

  uint256 public counter = 1;

  // CONSTRUCTOR
  constructor (
    string memory _name, 
    string memory _symbol
  ) ERC721(_name, _symbol) {}

  // MINTER

  function mint(address _to) external {
    require(msg.sender == minterAddress, "MockErc721WithMinter: only minter can mint");

    _mint(_to, counter);
    counter++;
  }

  // OWNER

  function setMinterAddress(address _minterAddress) external onlyOwner {
    minterAddress = _minterAddress;
  }

}
