// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC721, ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFactory {
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
@title ERC-721 contract with bonding curve pricing
@author Tempe Techie
*/
contract Nft721Bonding is ERC721, ERC721Enumerable, OwnableWithManagers, ReentrancyGuard {
  address public factoryAddress;
  address public metadataAddress;
  address public mintingFeeReceiver;

  string public constant pricingType = "bonding";

  uint256 public counter = 1; // counter for the tokenId
  uint256 public immutable createdAt; // NFT creation time
  uint256 public mintingFeePercentage; // in wei
  uint256 public immutable ratio; // ratio for the bonding curve

  // CONSTRUCTOR
  constructor(
    address factoryAddress_,
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
    createdAt = block.timestamp;
  }

  // READ PUBLIC

  /// @notice Get collection preview image
  function collectionPreview() public view returns (string memory) {
    return INftMd(metadataAddress).getCollectionPreviewImage(address(this));
  }

  function getBurnPrice() public view returns (uint256) {
    uint256 tSupply = totalSupply();

    if (tSupply < 2) {
      return 0;
    }

    uint256 price = _getBurnPriceBeforeFees(tSupply);

    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    return price - protocolFee - ownerFee;
  }

  function getMintPrice() public view returns (uint256) {
    uint256 price = _getMintPriceBeforeFees(totalSupply());

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

  function _getBurnPriceBeforeFees(uint256 totalSupply_) private view returns (uint256) {
    if (totalSupply_ < 2) {
      return 0;
    }

    return _getPrice(totalSupply_ - 1);
  }

  function _getMintPriceBeforeFees(uint256 totalSupply_) private view returns (uint256) {
    if (totalSupply_ == 0) {
      return _getPrice(1);
    } 
    
    return _getPrice(totalSupply_);
  }

  // get price for 1 NFT via bonding curve (supply is always > 1)

  // quadratic bonding curve
  function _getPrice(uint256 supply) private view returns (uint256) {
    return (((supply * (supply + 1) * (2 * supply + 1)) - ((supply - 1) * supply * (2 * (supply - 1) + 1))) * 10000 / 42069) * ratio / 31337;
  }
  
  /* 
  // alternative: negative exponential bonding curve
  function _getPrice(uint256 supply) internal view returns (uint256) {
    uint256 shape = 3;
    uint256 numerator = supply * ratio / 10000;
    uint256 denominator = supply + shape;
    return numerator / denominator;
  }
  */

  // WRITE

  function burn(uint256 tokenId) external nonReentrant returns (uint256) {
    uint256 tSupply = totalSupply();

    require(tSupply > 1, "Cannot sell the last NFT");
    require(_isApprovedOrOwner(msg.sender, tokenId), "Nft721Bonding: caller is not owner nor approved");

    uint256 price = _getBurnPriceBeforeFees(tSupply);

    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    _burn(tokenId);

    // add addWeiSpent call to the stats contract
    address statsAddress = IFactory(factoryAddress).statsAddress();
    if (statsAddress != address(0)) {
      IStats(statsAddress).addWeiSpent(_ownerOf(tokenId), protocolFee);
    }

    // send fees
    (bool successOwner, ) = owner().call{value: ownerFee}("");

    if (!successOwner) {
      protocolFee += ownerFee;
    }

    (bool successMfReceiver, ) = mintingFeeReceiver.call{value: protocolFee}("");
    require(successMfReceiver, "Nft721Bonding: Failed to send protocol fee");

    // send payment to the burn caller
    (bool successMsgSender, ) = msg.sender.call{value: price - ownerFee - protocolFee}("");
    require(successMsgSender, "Nft721Bonding: Failed to send payment");

    return price - ownerFee - protocolFee; // return the amount of ETH sent to the caller
  }

  function mint(address to) external payable nonReentrant returns (uint256) {
    uint256 tSupply = totalSupply();

    if (tSupply == 0) {
      _mint(owner(), counter); // mint the first NFT to the owner
      ++counter;
      ++tSupply;
    }

    uint256 price = _getMintPriceBeforeFees(tSupply);
    uint256 protocolFee = price * mintingFeePercentage / 1 ether;
    uint256 ownerFee = price * mintingFeePercentage / 1 ether;

    require(msg.value == price + protocolFee + ownerFee, "Insufficient payment");

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
    require(successMfReceiver, "Nft721Bonding: Failed to send protocol fee");

    _mint(to, counter);
    ++counter;

    return counter - 1; // return the tokenId of the minted NFT for the to address
  }

  // OWNER

  // set metadata address
  function setMetadataAddress(address metadataAddress_) external onlyManagerOrOwner {
    metadataAddress = metadataAddress_;
  }

  // set minting fee percentage
  function setMintingFeePercentage(uint256 mintingFeePercentage_) external onlyManagerOrOwner {
    require(mintingFeePercentage_ < (5 * 1e16), "Nft721Bonding: fee must be lower than 5%");
    mintingFeePercentage = mintingFeePercentage_;
  }

  // MINT FEE RECEIVER
  
  function setMintingFeeReceiver(address mintingFeeReceiver_) external {
    require(msg.sender == IFactory(factoryAddress).owner(), "Nft721Bonding: Only factory owner can set a new mintingFeeReceiver");
    mintingFeeReceiver = mintingFeeReceiver_;
  }
  
}
