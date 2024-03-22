// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC721, ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFactory {
  function mintingFeePercentage() external view returns (uint256);
  function owner() external view returns (address);
  function statsAddress() external view returns (address);
}

interface INftMd {
  function getCollectionPreviewImage(address nftAddress_) external view returns (string memory);
  function getMetadata(address nftAddress_, uint256 tokenId_) external view returns (string memory);
}

interface IStats {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
}

/** 
@title ERC-721 contract with classic pricing
@author Tempe Techie
*/
contract Nft721Classic is ERC721, ERC721Enumerable, OwnableWithManagers, ReentrancyGuard {
  address public factoryAddress;
  address public metadataAddress;
  address public mintingFeeReceiver;

  string public constant pricingType = "classic";

  uint256 public counter = 1; // counter for the tokenId
  uint256 public immutable createdAt; // NFT creation time
  uint256 public immutable maxSupply; // max supply of the NFT collection
  uint256 public mintPrice; // price for minting an NFT

  // CONSTRUCTOR
  constructor(
    address factoryAddress_,
    address metadataAddress_,
    address mintingFeeReceiver_,
    string memory name_,
    string memory symbol_,
    uint256 maxSupply_,
    uint256 mintPrice_
  ) ERC721(name_, symbol_) {
    factoryAddress = factoryAddress_;
    metadataAddress = metadataAddress_;
    mintingFeeReceiver = mintingFeeReceiver_;
    
    maxSupply = maxSupply_;
    mintPrice = mintPrice_;
    createdAt = block.timestamp;
  }

  // READ PUBLIC

  /// @notice Get collection preview image
  function collectionPreview() public view returns (string memory) {
    return INftMd(metadataAddress).getCollectionPreviewImage(address(this));
  }

  /// @dev This function is here because it also exists in the bonding NFT contract (for compatibility)
  function getMintPrice() public view returns (uint256) {
    return mintPrice;
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    _requireMinted(tokenId);

    return INftMd(metadataAddress).getMetadata(address(this), tokenId);
  }

  // READ PRIVATE & INTERNAL

  function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  // WRITE

  function mint(address to) external payable nonReentrant returns (uint256) {
    require(counter <= maxSupply, "Nft721Classic: Max supply reached");
    require(msg.value >= mintPrice, "Nft721Classic: Not enough ETH sent to cover price");

    uint256 protocolFee = msg.value * IFactory(factoryAddress).mintingFeePercentage() / 1 ether;
    uint256 ownerFee = msg.value - protocolFee;

    // add addWeiSpent call to the stats contract
    address statsAddress = IFactory(factoryAddress).statsAddress();
    if (statsAddress != address(0)) {
      IStats(statsAddress).addWeiSpent(msg.sender, protocolFee);
    }

    // send fees
    (bool successOwner, ) = owner().call{value: ownerFee}("");

    if (!successOwner) {
      protocolFee += ownerFee;
    }

    (bool successMfReceiver, ) = mintingFeeReceiver.call{value: protocolFee}("");
    require(successMfReceiver, "Nft721Classic: Failed to send protocol fee");

    _mint(to, counter);
    ++counter;

    return counter - 1; // return the tokenId of the minted NFT for the to address
  }

  // OWNER

  // set metadata address
  function setMetadataAddress(address metadataAddress_) external onlyManagerOrOwner {
    metadataAddress = metadataAddress_;
  }

  // MINT FEE RECEIVER
  
  function setMintingFeeReceiver(address mintingFeeReceiver_) external {
    require(msg.sender == IFactory(factoryAddress).owner(), "Nft721Classic: Only factory owner can set a new mintingFeeReceiver");
    mintingFeeReceiver = mintingFeeReceiver_;
  }
}