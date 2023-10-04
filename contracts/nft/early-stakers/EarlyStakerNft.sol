// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { ERC5192 } from "../../lib/ERC5192.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";

interface IEarlyStakerMetadata {
  function getMetadata(uint256 _tokenId) external view returns (string memory);
}

/**
 * @title EarlyStakerNft
 * @author Tempe Techie
 * @notice ERC-5192 is an extension of ERC-721 that makes the NFT soulbound (e.g. non-transferable)
 */
contract EarlyStakerNft is ERC5192, OwnableWithManagers {
  address public metadataAddress;
  address public minterAddress;

  bool public paused = false;
  uint256 public counter = 1;

  // CONSTRUCTOR
  constructor (
    address _metadataAddress,
    string memory _name, 
    string memory _symbol
  ) ERC5192(_name, _symbol, true) {
    metadataAddress = _metadataAddress;
  }

  // READ

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    return IEarlyStakerMetadata(metadataAddress).getMetadata(_tokenId);
  }

  // WRITE

  function mint(address _to) external {
    require(!paused, "EarlyStakerNft: minting is paused");
    require(msg.sender == minterAddress, "EarlyStakerNft: Only minter can mint");

    _mint(_to, counter);
    counter++;
  }

  // OWNER

  function changeMetadataAddress(address _metadataAddress) external onlyManagerOrOwner {
    metadataAddress = _metadataAddress;
  }

  function changeMinterAddress(address _minterAddress) external onlyManagerOrOwner {
    minterAddress = _minterAddress;
  }

  function ownerMintNft(address _to) external onlyManagerOrOwner {
    _mint(_to, counter);
    counter++;
  }

  function togglePaused() external onlyManagerOrOwner {
    paused = !paused;
  }

}
