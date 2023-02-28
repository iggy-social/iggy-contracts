// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIggyPostNft is IERC1155 {

  function getPostPrice (string memory _postId, address _author) external view returns (uint256);

  function owner() external view returns(address);

  function mint(
    string memory _postId, 
    address _author, 
    address _nftReceiver, 
    string memory _textPreview,
    uint256 _quantity
  ) external returns(uint256);

}

contract IggyPostMinter is Ownable, ReentrancyGuard {
  address public daoAddress;
  address public devAddress;
  address public immutable postAddress;

  bool public paused = false;

  uint256 public constant MAX_BPS = 10_000;
  uint256 public daoFee; // share of each domain purchase (in bips) that goes to the DAO/community that owns the frontend
  uint256 public devFee; // share of each domain purchase (in bips) that goes to the developer (Iggy team)
  uint256 public referrerFee; // share of each domain purchase (in bips) that goes to the referrer

  // CONSTRUCTOR
  constructor(
    address _daoAddress,
    address _devAddress,
    address _postAddress,
    uint256 _daoFee,
    uint256 _devFee,
    uint256 _referrerFee
  ) {
    daoAddress = _daoAddress;
    devAddress = _devAddress;
    postAddress = _postAddress;

    daoFee = _daoFee;
    devFee = _devFee;
    referrerFee = _referrerFee;
  }

  // WRITE

  function mint(
    string memory _postId, 
    address _author, 
    address _nftReceiver, 
    address _referrer,
    string memory _textPreview,
    uint256 _quantity
  ) external nonReentrant payable returns(uint256 tokenId) {
    require(!paused, "Minting paused");

    // find price
    uint256 price = IIggyPostNft(postAddress).getPostPrice(_postId, _author) * _quantity;

    require(msg.value >= price, "Value below price");

    // send a referrer fee
    if (referrerFee > 0 && _referrer != address(0)) {
      uint256 referrerPayment = (price * referrerFee) / MAX_BPS;
      (bool sentReferrerFee, ) = payable(_referrer).call{value: referrerPayment}("");
      require(sentReferrerFee, "Failed to send referrer fee");
    }

    // send a dev fee
    if (devFee > 0 && devAddress != address(0)) {
      uint256 devPayment = (price * devFee) / MAX_BPS;
      (bool sentDevFee, ) = payable(devAddress).call{value: devPayment}("");
      require(sentDevFee, "Failed to send dev fee");
    }

    // send a dao fee
    if (daoFee > 0 && daoAddress != address(0)) {
      uint256 daoFeePayment = (price * daoFee) / MAX_BPS;
      (bool sentDaoFee, ) = payable(daoAddress).call{value: daoFeePayment}("");
      require(sentDaoFee, "Failed to send dao fee");
    }

    // send the rest to post author
    (bool sent, ) = payable(_author).call{value: address(this).balance}("");
    require(sent, "Failed to send payment to the post author");

    // mint the post as NFT
    tokenId = IIggyPostNft(postAddress).mint(_postId, _author, _nftReceiver, _textPreview, _quantity);
  }

  // OWNER

  // change dao fee
  function changeDaoFee(uint256 _daoFee) external onlyOwner {
    require(_daoFee <= MAX_BPS, "Fee cannot be more than 100%");
    daoFee = _daoFee;
  }

  // change referrer fee
  function changeReferrerFee(uint256 _referrerFee) external onlyOwner {
    require(_referrerFee <= 2000, "Fee cannot be more than 20%");
    referrerFee = _referrerFee;
  }

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyOwner {
    IERC20(tokenAddress_).transfer(recipient_, tokenAmount_);
  }

  /// @notice Recover any ERC-721 token mistakenly sent to this contract address
  function recoverERC721(address tokenAddress_, uint256 tokenId_, address recipient_) external onlyOwner {
    IERC721(tokenAddress_).transferFrom(address(this), recipient_, tokenId_);
  }

  /// @notice Recover any ERC-1155 token mistakenly sent to this contract address
  function recoverERC1155(address tokenAddress_, uint256 tokenId_, address recipient_, uint256 _amount) external onlyOwner {
    IERC1155(tokenAddress_).safeTransferFrom(address(this), recipient_, tokenId_, _amount, "");
  }

  function togglePaused() external onlyOwner {
    paused = !paused;
  }

  /// @notice Withdraw native coins from contract
  function withdraw() external onlyOwner {
    (bool success, ) = owner().call{value: address(this).balance}("");
    require(success, "Failed to withdraw native coins from contract");
  }

  // OTHER WRITE METHODS

  /// @notice This changes the DAO address in the minter contract
  function changeDaoAddress(address _daoAddress) external {
    require(_msgSender() == daoAddress, "Sender is not the DAO");
    daoAddress = _daoAddress;
  }

  /// @notice This changes the developer's address in the minter contract
  function changeDevAddress(address _devAddress) external {
    require(_msgSender() == devAddress, "Sender is not the developer");
    devAddress = _devAddress;
  }

  // change dev fee (only dev can change it)
  function changeDevFee(uint256 _devFee) external {
    require(_msgSender() == devAddress, "Sender is not the developer");
    require(_devFee <= 2000, "Fee cannot be more than 20%");
    devFee = _devFee;
  }

  // RECEIVE & FALLBACK
  receive() external payable {}
  fallback() external payable {}
 
}