// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IIggyPostNftMetadata {
  function getMetadata(uint256 _tokenId, string memory _postId, address _author, string memory _textPreview) external view returns (string memory);
}

/// @title Iggy Social Post NFT
contract IggyPostNft1155 is ERC1155, Ownable, ReentrancyGuard {
  address public metadataAddress; // address of the metadata contract
  address public minterAddress; // address of the minter contract

  uint256 public counter = 1; // id counter, starts with 1
  uint256 public defaultPrice; // default price for minting a post
  uint256 public textPreviewLength = 100; // length of the text preview

  struct Post {
    uint256 tokenId;
    string postId; // post id on Ceramic network
    address author;
    string textPreview;
    uint256 timestamp;
  }

  // post mappings
  mapping (uint256 => Post) public getPost; // mapping from token id to post
  mapping (string => mapping (address => uint256)) public getPostTokenId; // mapping (postId => mapping (authorAddress => tokenId))

  // price mappings
  mapping (address => uint256) public getAuthorsDefaultPrice; // mapping (authorAddress => price), if zero, use default price
  mapping (string => mapping (address => uint256)) public getPriceForPost; // mapping (postId => mapping (authorAddress => price)), if zero, use author's default price
  
  // post minting deadline
  mapping (string => mapping (address => uint256)) public getPostMintingTime; // mapping (postId => mapping (authorAddress => secondsToMint)), if zero, there's no deadline to mint

  // events
  event MintPost (address nftReceiver, string post, address author, uint256 quantity);

  // constructor
  constructor(
    uint256 _defaultPrice,
    address _metadataAddress
  ) ERC1155("") {
    defaultPrice = _defaultPrice;
    metadataAddress = _metadataAddress;
  }

  // READ

  function doesPostExist(string memory _postId, address _authorId) external view returns (bool) {
    return getPostTokenId[_postId][_authorId] != 0;
  }

  function getPostPrice(string memory _postId, address _author) external view returns (uint256) {
    uint256 price = getPriceForPost[_postId][_author];

    if (price == 0) {
      price = getAuthorsDefaultPrice[_author];
      
      if (price == 0) {
        price = defaultPrice;
      }
    }

    return price;
  }

  function uri(uint256 _tokenId) public view override returns (string memory) {
    Post memory post = getPost[_tokenId];
    return IIggyPostNftMetadata(metadataAddress).getMetadata(_tokenId, post.postId, post.author, post.textPreview);
  }

  // WRITE

  function authorSetPostPrice(string memory _postId, uint256 _price) external {
    getPriceForPost[_postId][msg.sender] = _price;
  }

  function authorSetDefaultPrice(uint256 _price) external {
    getAuthorsDefaultPrice[msg.sender] = _price;
  }

  /// @notice Mint a post NFT
  function mint(
    string memory _postId, 
    address _author, 
    address _nftReceiver, 
    string memory _textPreview,
    uint256 _quantity
  ) nonReentrant external returns(uint256 tokenId) {
    require(msg.sender == minterAddress, "IggyPost: Only minter can mint");
    require(bytes(_textPreview).length <= textPreviewLength, "IggyPost: Text preview is too long");

    tokenId = getPostTokenId[_postId][_author];

    if (tokenId == 0) {
      tokenId = counter;
      counter++;

      getPostTokenId[_postId][_author] = tokenId;
      getPost[tokenId] = Post(tokenId, _postId, _author, _textPreview, block.timestamp);
    }

    // check if author has set up a mint time
    uint256 mintTime = getPostMintingTime[_postId][_author];

    if (mintTime != 0) {
      require(block.timestamp <= (getPost[tokenId].timestamp + mintTime), "IggyPost: Minting deadline has passed");
    }

    _mint(_nftReceiver, tokenId, _quantity, "");

    emit MintPost(_nftReceiver, _postId, _author, _quantity);
  }

  // OWNER

  // change default price
  function ownerChangeDefaultPrice(uint256 _newDefaultPrice) external onlyOwner {
    defaultPrice = _newDefaultPrice;
  }

  // change metadata address
  function ownerChangeMetadataAddress(address _newMetadataAddress) external onlyOwner {
    metadataAddress = _newMetadataAddress;
  }

  // change minter address
  function ownerChangeMinterAddress(address _newMinterAddress) external onlyOwner {
    minterAddress = _newMinterAddress;
  }

  // change text preview length
  function ownerChangeTextPreviewLength(uint256 _newTextPreviewLength) external onlyOwner {
    textPreviewLength = _newTextPreviewLength;
  }

}