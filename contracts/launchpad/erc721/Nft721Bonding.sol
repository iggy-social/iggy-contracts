// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC721, ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFactory {
  function owner() external view returns (address);
  function statsAddress() external view returns (address);
}

interface INftMd {
  function getMetadata(address nftAddress_, uint256 tokenId_) external view returns (string memory);
}

interface IStats {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
}

/** 
@title ERC-721 contract with bonding curve pricing
@author Tempe Techie
*/
contract Nft721Bonding is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
  address public factoryAddress;
  address public metadataAddress;
  address public mintingFeeReceiver;

  string public constant pricingType = "bonding";

  uint256 public mintingFeePercentage; // in wei
  uint256 public immutable ratio; // ratio for the bonding curve

  // CONSTRUCTOR
  constructor(
    address factoryAddress_,
    address contractOwner_,
    address metadataAddress_,
    address mintingFeeReceiver_,
    string memory name_,
    string memory symbol_,
    uint256 mintingFeePercentage_,
    uint256 ratio_
  ) ERC721(name_, symbol_) {
    factoryAddress = factoryAddress_;
    metadataAddress = metadataAddress_;
    mintingFeeReceiver = mintingFeeReceiver_;
    
    mintingFeePercentage = mintingFeePercentage_;
    ratio = ratio_;

    transferOwnership(contractOwner_);
  }

  // READ PUBLIC
  function getBurnPrice(uint256 amount) public view returns (uint256) {
    uint256 tSupply = totalSupply();

    if (tSupply == 0) { // TODO: change to < 2 ?
      return 0;
    }

    uint256 price = _getBurnPriceBeforeFees(amount, tSupply);

    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    return price - protocolFee - ownerFee;
  }

  function getMintPrice(uint256 amount) public view returns (uint256) {
    uint256 price = _getMintPriceBeforeFees(amount, totalSupply());

    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    return price + protocolFee + ownerFee;
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

  function _getBurnPriceBeforeFees(uint256 amount_, uint256 totalSupply_) private view returns (uint256) {
    if (totalSupply_ == 0) { // TODO: change to < 2 ?
      return 0;
    }

    return _getPrice(totalSupply_ - amount_, amount_);
  }

  function _getMintPriceBeforeFees(uint256 amount_, uint256 totalSupply_) private view returns (uint256) {
    if (totalSupply_ == 0) {
      return ratio / 16000;
    } 
    
    return _getPrice(totalSupply_, amount_);
  }

  function _getPrice(uint256 supply, uint256 amount) private view returns (uint256) {
    uint256 sum1 = supply == 0 ? 0 : (supply - 1 )* (supply) * (2 * (supply - 1) + 1) / 6;
    uint256 sum2 = supply == 0 && amount == 1 ? 0 : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
    uint256 summation = sum2 - sum1;
    return summation * ratio / 16000;
  }

  // WRITE

  function burn(uint256 tokenId) external nonReentrant returns (uint256) {
    uint256 tSupply = totalSupply();

    require(tSupply > 1, "Cannot sell the last NFT");
    require(_isApprovedOrOwner(msg.sender, tokenId), "Nft721Bonding: caller is not owner nor approved");

    uint256 price = _getBurnPriceBeforeFees(1, tSupply);

    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    _burn(tokenId);

    // add addWeiSpent call to the stats contract
    IStats(IFactory(factoryAddress).statsAddress()).addWeiSpent(_ownerOf(tokenId), protocolFee);

    // send fees
    (bool success1, ) = mintingFeeReceiver.call{value: protocolFee}("");
    (bool success2, ) = owner().call{value: ownerFee}("");

    // send payment to the burn caller
    (bool success3, ) = msg.sender.call{value: price - ownerFee - protocolFee}("");

    require(success1 && success2 && success3, "Unable to send funds");

    return price - ownerFee - protocolFee; // return the amount of ETH sent to the caller
  }

  function mint(address to) external payable nonReentrant returns (uint256) {
    uint256 tSupply = totalSupply();

    if (tSupply == 0) {
      _mint(owner(), 1); // mint the first NFT to the owner
      ++tSupply;
    }

    uint256 price = _getMintPriceBeforeFees(1, tSupply);
    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    require(msg.value == price + protocolFee + ownerFee, "Insufficient payment");

    // add addWeiSpent call to the stats contract
    IStats(IFactory(factoryAddress).statsAddress()).addWeiSpent(msg.sender, protocolFee);

    // send fees
    (bool success1, ) = mintingFeeReceiver.call{value: protocolFee}("");
    (bool success2, ) = owner().call{value: ownerFee}("");

    require(success1 && success2, "Unable to send funds");

    _mint(to, tSupply + 1);

    return tSupply + 1; // return the tokenId of the minted NFT for the to address
  }

  // OWNER

  // set metadata address
  function setMetadataAddress(address metadataAddress_) external onlyOwner {
    metadataAddress = metadataAddress_;
  }

  // set minting fee percentage
  function setMintingFeePercentage(uint256 mintingFeePercentage_) external onlyOwner {
    mintingFeePercentage = mintingFeePercentage_;
  }

  // MINT FEE RECEIVER
  
  function setMintingFeeReceiver(address mintingFeeReceiver_) external {
    require(msg.sender == IFactory(factoryAddress).owner(), "Nft721Bonding: Only factory owner can set a new mintingFeeReceiver");
    mintingFeeReceiver = mintingFeeReceiver_;
  }
  
}
