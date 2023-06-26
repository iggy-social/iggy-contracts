// npx hardhat run scripts/post/IggyPostNft1155/calls.js --network songbird

const postAddress = "0xE33F27496A9cE75313f6d1FA2BA95657Fc904387";
const minterAddress = "0x1C8666e706C03EDB1c0D04a48b0B7762fc645cD4";
const metadataAddress = "0xdADFC61225BC17785E185FD6F88619e42D996472";

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

  const postContract = new ethers.Contract(postAddress, postInterface, deployer);
  const metadataContract = new ethers.Contract(metadataAddress, metadataInterface, deployer);
  const minterContract = new ethers.Contract(minterAddress, minterInterface, deployer);

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
  const paused = await minterContract.paused();
  console.log("Paused: " + paused);

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

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });