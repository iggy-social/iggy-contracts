// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Iggy Social Post NFT
contract IggyPostNft721 is ERC721, OwnableWithManagers {
  address public metadataAddress; // address of the metadata contract
  address public minterAddress; // address of the minter contract

  uint256 public counter = 1; // id counter, starts with 1
  uint256 public defaultPrice; // default price for minting a post

  struct Post {
    uint256 tokenId;
    string postId; // post id on Ceramic network
    address authorId;
    string textPreview;
  }

  // constructor
  constructor(
    uint256 _defaultPrice,
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {
    defaultPrice = _defaultPrice;
  }

  function tokenURI(uint256) public view override returns (string memory) {
    // call metadata contract to get uri
    return "";
  }

  // WRITE
  // WIP - not production ready yet

  // function mint

  // OWNER

  // set default price
  function ownerChangeDefaultPrice (uint256 _newDefaultPrice) public onlyManagerOrOwner {
    defaultPrice = _newDefaultPrice;
  }

  // set metadata address
  function ownerChangeMetadataAddress (address _newMetadataAddress) public onlyManagerOrOwner {
    metadataAddress = _newMetadataAddress;
  }

  // change minter address
  function ownerChangeMinterAddress (address _newMinterAddress) public onlyManagerOrOwner {
    minterAddress = _newMinterAddress;
  }

}