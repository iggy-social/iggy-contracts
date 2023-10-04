// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface INFT is IERC721 {
  function balanceOf(address owner) external view returns (uint256 balance);
  function mint(address to) external;
}

contract MerkleClaimerERC721 is OwnableWithManagers {
  address public immutable nftAddress;
  bool public paused = false;
  bytes32 public immutable root; // merkle root

  // CONSTRUCTOR
  constructor(address nftAddress_, bytes32 root_) {
    nftAddress = nftAddress_;
    root = root_;
  }

  // WRITE
  function claim(address to_, bytes32[] memory proof_) external {
    require(!paused, "MerkleClaimerERC721: minting is paused");
    require(INFT(nftAddress).balanceOf(to_) == 0, "MerkleClaimerERC721: user has already minted the NFT");

    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(to_, 1)))); // amount is 1 NFT
    require(MerkleProof.verify(proof_, root, leaf), "MerkleClaimerERC721: Invalid proof");

    INFT(nftAddress).mint(to_);
  }

  // OWNER
  function togglePaused() external onlyManagerOrOwner {
    paused = !paused;
  }
}