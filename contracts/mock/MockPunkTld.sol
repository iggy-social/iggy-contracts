// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

contract MockPunkTld {
  mapping(string => address) public domainHolders;

  constructor(address domainHolder_, string memory domainName_) {
    domainHolders[domainName_] = domainHolder_;
  }

  function defaultNames(address) external pure returns(string memory) {
    return "mockname";
  }

  function domains(string calldata _domainName) external view returns(string memory, uint256, address, string memory) {
    return (
      _domainName, // domain name
      1, // domain NFT ID
      domainHolders[_domainName], // domain holder
      "" // domain data
    );
  }

  function getDomainHolder(string calldata _domainName) external view returns(address) {
    return domainHolders[_domainName];
  }

  function name() external pure returns(string memory) {
    return ".tld";
  }

  // WRITE

  // this is mock function for testing purposes only (it does not exist in the real Punk Domains contract)
  function register(string calldata _domainName, address _domainHolder) external {
    require(_domainHolder != address(0), "MockPunkTld: domain holder cannot be zero address");
    require(keccak256(abi.encodePacked(_domainName)) != keccak256(abi.encodePacked("existing1")), "MockPunkTld: domain name already exists");

    domainHolders[_domainName] = _domainHolder;
  }
}