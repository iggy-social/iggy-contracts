// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IModToken {
  function balanceOf(address account) external view returns (uint256);
}

/**
 * @title ChatContextV1
 * @author TempeTechie.eth
 * @notice This contract is used to store chat messages within a certain context. Context can be a forum category, a website chat, etc.
 * 
 * Features:
 * - Simple message thread, where each main post can also have an array of replies
 * - Moderation and moderators: mods are determined based on holding a mod token (can be NFT, SBT, or ERC-20 - whatever has the balanceOf function)
 * - Post author and mods can delete a message (it's marked as deleted instead of actually being deleted)
 * - Mods can restore a deleted message
 * - Pause: owner can pause the contract to prevent any new posts (can be useful in case the chat context is archived)
 * - Owner is a single address, but it can be a governance contract where chat users vote on the moderators and other owner functions
 * - Retrieve all messages from a chat context, or exclude deleted ones, and/or retrieve only some fraction of them (pagination)
 * - Not included: edit a message, fetch posts by a specific user, etc.
 */
contract ChatContextV1 is Ownable {
  address public modTokenAddress; // NFT, SBT, or ERC-20 token which is used to determine if an address is a mod
  uint256 public modMinBalance; // minimum balance of mod token required to be considered a mod
  bool public paused = false; // whether the contract is paused or not
  uint256 public price = 0.00001 ether; // price to post a message (can serve as anti-spam measure; can be set to 0 to disable)

  Message[] public mainMessages; // array of main messages
  mapping(uint256 => Message[]) public replies; // mapping from main message index to array of replies
  mapping(address => bool) public suspended; // whether an address is suspended from posting or not

  struct Message {
    address author;
    uint256 createdAt; // timestamp when the message was created
    bool deleted; // whether the message is deleted or not
    uint256 index; // the index of the message in the mainMessages array or replies array
    uint256 repliesCount; // number of replies to the message
    string url; // URL pointing to the message stored on Arweave or IPFS etc., e.g. ar://some-identifier, ipfs://someIdentifier, ...
  }

  // CONSTRUCTOR
  constructor(address modTokenAddress_, address owner_, uint256 modMinBalance_) {
    modTokenAddress = modTokenAddress_;
    modMinBalance = modMinBalance_;
    transferOwnership(owner_);
  }

  // MODIFIERS
  modifier onlyMods() {
    require(
      IModToken(modTokenAddress).balanceOf(msg.sender) >= modMinBalance || 
      msg.sender == owner(),
      "Not a mod or owner"
    );
    _;
  }

  // EVENTS
  event MessagePosted(address indexed author, string indexed url, uint256 createdAt);
  event MessageReplied(address indexed author, string indexed url, uint256 indexed mainMsgIndex, uint256 createdAt);
  event MainMessageDeleted(address indexed eraser, string indexed url, uint256 indexed mainMsgIndex, uint256 deletedAt);
  event MainMessageRestored(address indexed restorer, string indexed url, uint256 indexed mainMsgIndex, uint256 restoredAt);
  event ReplyDeleted(address indexed eraser, string indexed url, uint256 indexed mainMsgIndex, uint256 replyMsgIndex, uint256 deletedAt);
  event ReplyRestored(address indexed restorer, string indexed url, uint256 indexed mainMsgIndex, uint256 replyMsgIndex, uint256 restoredAt);

  // READ FUNCTIONS

  /**
   * @notice Fetch the last N main messages
   * @param includeDeleted_ Whether to include deleted messages
   * @param length_ The number of messages to fetch
   * @return Message[] array of main messages
   */
  function fetchLastMainMessages(
    bool includeDeleted_, // if false, you may not get the full requested length of replies if some are deleted
    uint256 length_
  ) external view returns (Message[] memory) {
    // if length_ is greater than mainMessages.length, return all mainMessages
    if (length_ > mainMessages.length) {
      return _fetchMessages(mainMessages, includeDeleted_, 0, mainMessages.length);
    }
    return _fetchMessages(mainMessages, includeDeleted_, mainMessages.length - length_, length_);
  }

  /**
   * @notice Fetch multiple main messages (pagination)
   * @param includeDeleted_ Whether to include deleted messages
   * @param fromIndex_ The index to start fetching from
   * @param length_ The number of messages to fetch
   * @return Message[] array of main messages
   */
  function fetchMainMessages(
    bool includeDeleted_, 
    uint256 fromIndex_, 
    uint256 length_
  ) external view returns (Message[] memory) {
    return _fetchMessages(mainMessages, includeDeleted_, fromIndex_, length_);
  }

  /**
   * @notice Fetch the last N replies to a main message
   * @param includeDeleted_ Whether to include deleted messages
   * @param mainMsgIndex_ The index of the main message
   * @param length_ The number of messages to fetch
   * @return Message[] array of replies
   */
  function fetchLastReplies(
    bool includeDeleted_, // if false, you may not get the full requested length of replies if some are deleted
    uint256 mainMsgIndex_,
    uint256 length_
  ) external view returns (Message[] memory) {
    // if length_ is greater than replies[mainMsgIndex_].length, return all replies
    if (length_ > replies[mainMsgIndex_].length) {
      return _fetchMessages(replies[mainMsgIndex_], includeDeleted_, 0, replies[mainMsgIndex_].length);
    }
    return _fetchMessages(replies[mainMsgIndex_], includeDeleted_, replies[mainMsgIndex_].length - length_, length_);
  }

  /**
   * @notice Fetch multiple reply messages (pagination) of a single main message
   * @param includeDeleted_ Whether to include deleted messages
   * @param mainMsgIndex_ The index of the main message
   * @param fromIndex_ The index to start fetching from
   * @param length_ The number of messages to fetch
   * @return Message[]
   */
  function fetchReplies(
    bool includeDeleted_, 
    uint256 mainMsgIndex_,
    uint256 fromIndex_,
    uint256 length_
  ) external view returns (Message[] memory) {
    return _fetchMessages(replies[mainMsgIndex_], includeDeleted_, fromIndex_, length_);
  }

  /**
   * @notice Get a single main message at a given index
   * @param mainMsgIndex_ The index of the main message
   * @return Message
   */
  function getMainMessage(uint256 mainMsgIndex_) external view returns (Message memory) {
    return mainMessages[mainMsgIndex_];
  }

  function getMainMessageCount() external view returns (uint256) {
    return mainMessages.length;
  }

  /**
   * @notice Get a single reply message at a given index
   * @param mainMsgIndex_ The index of the main message
   * @param replyMsgIndex_ The index of the reply message
   * @return Message
   */
  function getReply(
    uint256 mainMsgIndex_, 
    uint256 replyMsgIndex_
  ) external view returns (Message memory) {
    return replies[mainMsgIndex_][replyMsgIndex_];
  }

  function getReplyCount(uint256 mainMsgIndex_) external view returns (uint256) {
    return replies[mainMsgIndex_].length;
  }

  function isUserMod(address user_) public view returns (bool) {  
    return IModToken(modTokenAddress).balanceOf(user_) >= modMinBalance || user_ == owner();
  }

  // WRITE FUNCTIONS

  /**
   * @notice Create a new main message
   * @param url_ The URL of the main message
   */
  function createMessage(string memory url_) external payable {
    require(!paused, "Contract is paused");
    require(!suspended[msg.sender], "You are suspended from posting");
    require(bytes(url_).length > 0, "URL cannot be empty");
    require(msg.value >= price, "Payment is less than the price");

    Message memory newMsg = Message({
      author: msg.sender,
      url: url_,
      createdAt: block.timestamp,
      deleted: false,
      repliesCount: 0,
      index: mainMessages.length // Set the index to the current length of mainMessages
    });

    mainMessages.push(newMsg);
    emit MessagePosted(msg.sender, url_, block.timestamp);
  }

  /**
   * @notice Create a new reply message to a main message
   * @param mainMsgIndex_ The index of the main message to reply to
   * @param url_ The URL of the reply message
   */
  function createReply(uint256 mainMsgIndex_, string memory url_) external payable {
    require(!paused, "Contract is paused");
    require(!suspended[msg.sender], "You are suspended from posting");
    require(bytes(url_).length > 0, "URL cannot be empty");
    require(msg.value >= price, "Payment is less than the price");
    Message memory newReply = Message({
      author: msg.sender,
      url: url_,
      createdAt: block.timestamp,
      deleted: false,
      repliesCount: 0,
      index: replies[mainMsgIndex_].length // Set the index to the current length of replies for this main message
    });

    replies[mainMsgIndex_].push(newReply);
    mainMessages[mainMsgIndex_].repliesCount++;
    emit MessageReplied(msg.sender, url_, mainMsgIndex_, block.timestamp);
  }  

  /**
   * @notice Delete a main message
   * @param mainMsgIndex_ The index of the main message to delete
   */
  function deleteMessage(uint256 mainMsgIndex_) external {
    require(
      mainMessages[mainMsgIndex_].author == msg.sender || 
      isUserMod(msg.sender), 
      "Not the author, mod, or owner"
    );
    mainMessages[mainMsgIndex_].deleted = true;
    emit MainMessageDeleted(msg.sender, mainMessages[mainMsgIndex_].url, mainMsgIndex_, block.timestamp);
  }

  /**
   * @notice Delete a reply message
   * @param mainMsgIndex_ The index of the main message
   * @param replyMsgIndex_ The index of the reply message to delete
   */
  function deleteReply(uint256 mainMsgIndex_, uint256 replyMsgIndex_) external {
    require(
      replies[mainMsgIndex_][replyMsgIndex_].author == msg.sender || 
      isUserMod(msg.sender), 
      "Not the author, mod, or owner"
    );
    replies[mainMsgIndex_][replyMsgIndex_].deleted = true;
    mainMessages[mainMsgIndex_].repliesCount--;
    emit ReplyDeleted(msg.sender, replies[mainMsgIndex_][replyMsgIndex_].url, mainMsgIndex_, replyMsgIndex_, block.timestamp);
  }

  // INTERNAL FUNCTIONS
  function _fetchMessages(
    Message[] storage messages_,
    bool includeDeleted_, 
    uint256 fromIndex_, 
    uint256 length_
  ) internal view returns (Message[] memory) {
    uint256 totalMessages = messages_.length;
    uint256 resultCount = 0;
    uint256 i = fromIndex_;
    
    Message[] memory result = new Message[](length_);

    while (resultCount < length_ && i < totalMessages) {
      Message memory selectedMsg = messages_[i];

      if (includeDeleted_ || !selectedMsg.deleted) {
        result[resultCount] = selectedMsg;
        resultCount++;
      }

      i++;
    }

    // Reduce the array length using assembly
    assembly {
      mstore(result, resultCount)
    }

    return result;
  }

  // MODERATOR

  /**
   * @notice Restore a main message
   * @param mainMsgIndex_ The index of the main message to restore
   */
  function restoreMessage(uint256 mainMsgIndex_) external onlyMods {
    require(mainMessages[mainMsgIndex_].deleted, "Message is not deleted");
    mainMessages[mainMsgIndex_].deleted = false;
    emit MainMessageRestored(msg.sender, mainMessages[mainMsgIndex_].url, mainMsgIndex_, block.timestamp);
  }

  /**
   * @notice Restore a reply message
   * @param mainMsgIndex_ The index of the main message
   * @param replyMsgIndex_ The index of the reply message to restore
   */
  function restoreReply(uint256 mainMsgIndex_, uint256 replyMsgIndex_) external onlyMods {
    require(replies[mainMsgIndex_][replyMsgIndex_].deleted, "Reply is not deleted");
    replies[mainMsgIndex_][replyMsgIndex_].deleted = false;
    emit ReplyRestored(msg.sender, replies[mainMsgIndex_][replyMsgIndex_].url, mainMsgIndex_, replyMsgIndex_, block.timestamp);
  }

  /**
   * @notice Suspend a user from posting
   * @param user_ The address of the user to suspend
   */
  function suspendUser(address user_) external onlyMods {
    suspended[user_] = true;
  }

  /**
   * @notice Pause the contract to prevent any new posts, or unpause it
   */
  function togglePaused() external onlyMods {
    paused = !paused;
  }

  /**
   * @notice Unsuspend a user from posting
   * @param user_ The address of the user to unsuspend
   */
  function unsuspendUser(address user_) external onlyMods {
    suspended[user_] = false;
  }

  // OWNER
  function withdrawRevenue(address to_) external onlyOwner {
    (bool success, ) = to_.call{value: address(this).balance}("");
    require(success, "Transfer failed");
  }

  function setModTokenAddress(address modTokenAddress_) external onlyOwner {
    modTokenAddress = modTokenAddress_;
  }

  function setModMinBalance(uint256 modMinBalance_) external onlyOwner {
    modMinBalance = modMinBalance_;
  }

  function setPrice(uint256 price_) external onlyOwner {
    price = price_;
  }
}
