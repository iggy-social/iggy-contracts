// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";

contract EarlyStakerMetadata is OwnableWithManagers {
  string public description;
  string public externalUrl;
  string public image;
  string public name;
  string public video; // animation_url

  // CONSTRUCTOR
  constructor (
    string memory description_, 
    string memory externalUrl_,
    string memory image_,
    string memory name_,
    string memory video_
  ) {
    description = description_;
    externalUrl = externalUrl_;
    image = image_;
    name = name_;
    video = video_;
  }

  // READ

  function getMetadata(uint256 tokenId_) public view returns (string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        '{"name": "', name,'", ',
        '"image": "', image, '", ',
        '"external_url": "', externalUrl, '", ',
        '"description": "', description, '", ',
        '"animation_url": "', video, '"',
        '}'))))
    );
  }

  // OWNER

  function changeDescription(string memory description_) external onlyManagerOrOwner {
    description = description_;
  }

  function changeExternalUrl(string memory externalUrl_) external onlyManagerOrOwner {
    externalUrl = externalUrl_;
  }

  function changeImage(string memory image_) external onlyManagerOrOwner {
    image = image_;
  }

  function changeName(string memory name_) external onlyManagerOrOwner {
    name = name_;
  }

  function changeVideo(string memory video_) external onlyManagerOrOwner {
    video = video_;
  }

}
