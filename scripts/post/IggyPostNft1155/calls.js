// npx hardhat run scripts/post/IggyPostNft1155/calls.js --network songbird

const postAddress = "0xE33F27496A9cE75313f6d1FA2BA95657Fc904387";
const minterAddress = "0x9e9905FA405A5FC7Ee2DEB94CbAc089B4FE6f0Ef";
const metadataAddress = "0xdADFC61225BC17785E185FD6F88619e42D996472";
const statsAddress = "0xE2AfE33f16519e31c6FFE5eEb333A0887a44D2BC";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Calling methods with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const postInterface = new ethers.utils.Interface([
    "function ownerChangeDefaultPrice(uint256 _newDefaultPrice) external",
    "function ownerChangeMinterAddress(address _newMinterAddress) external",
    "function minterAddress() view external returns(address)",
    "function mint(string memory, address, address, string memory, uint256) external returns(uint256)"
  ]);

  const metadataInterface = new ethers.utils.Interface([
    "function changeDescription(string calldata _description) external"
  ]);

  const minterInterface = new ethers.utils.Interface([
    "function getCurrentChatEthRatio() public view returns(uint256)", // v2 specific function
    "function changeChatEthRatio(uint256 _chatEthRatio) external", // v2 specific function
    "function paused() public view returns(bool)",
    "function togglePaused() external",
    "function transferOwnership(address newOwner) external"
  ]);

  const statsInterface = new ethers.utils.Interface([
    "function minterAddress() view external returns(address)",
    "function setMinterAddress(address _minterAddress) external"
  ]);

  const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  const metadataContract = new ethers.Contract(metadataAddress, metadataInterface, deployer);
  const minterContract = new ethers.Contract(minterAddress, minterInterface, deployer);
  const statsContract = new ethers.Contract(statsAddress, statsInterface, deployer);

  // GET CURRENT CHAT ETH RATIO
  //const currentChatEthRatio = await minterContract.getCurrentChatEthRatio();
  //console.log("Current chat eth ratio: " + currentChatEthRatio);

  // CHANGE CHAT ETH RATIO
  //await minterContract.changeChatEthRatio(10);

  // CHANGE DEFAULT PRICE
  //await postContract.ownerChangeDefaultPrice(ethers.utils.parseEther("99"));

  // MINTER: TOGGLE PAUSED
  //await minterContract.togglePaused();

  // check if paused
  /*
  const paused = await minterContract.paused();
  console.log("Paused: " + paused);
  */

  // CHANGE MINTER

  /*

  const minterBefore = await postContract.minterAddress();
  console.log("Minter before: " + minterBefore);

  //await postContract.ownerChangeMinterAddress(minterAddress);

  const minterAfter = await postContract.minterAddress();
  console.log("Minter after: " + minterAfter);

  // MINT NFT

  const mintTx = await postContract.mint(
    "kjzl6cwe1jw14atwguxr7gatk5b4ekzk10jono427hh2d3v8zyquwhw8puqq130", // post ID
    "0xb29050965a5ac70ab487aa47546cdcbc97dae45d", // post author
    "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2", // nft recipient
    "test 456", // text preview
    1 // quantity
  );

  const mintReceipt = await mintTx.wait();
  console.log("Mint receipt: ");
  console.log(mintReceipt);

  */

  // CHANGE METADATA DESCRIPTION
  /*
  await metadataContract.changeDescription(
    "Description text"
  );
  */

  // CHANGE STATS ADDRESS
  const statsMinterAddressBefore = await statsContract.minterAddress();
  console.log("Stats minter address before: " + statsMinterAddressBefore);

  //await statsContract.setMinterAddress(minterAddress);
  
  const statsMinterAddressAfter = await statsContract.minterAddress();
  console.log("Stats minter address after: " + statsMinterAddressAfter);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });