// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockErc721 is ERC721 {
  uint256 public counter = 1;

  // CONSTRUCTOR
  constructor (
    string memory _name, 
    string memory _symbol
  ) ERC721(_name, _symbol) {}

  // MINTER

  function mint(address _to) external {
    _mint(_to, counter);
    counter++;
  }

}
