// npx hardhat run scripts/launchpad/erc721/other/checkNftData.js --network degen

const { ethers } = require("hardhat");

const contractName = "Nft721Bonding";

const contractAddress = "0xA8ba334a61E10afB74D4d7088197d6C9f6002629";
const eoa = "0x8fEaFd5e0FCefdd2624906c0F913D563306aAe17";

async function main() {
  const [caller] = await ethers.getSigners();

  /*
  console.log("Calling functions with the account:", caller.address);
  console.log("Account balance:", (await caller.getBalance()).toString());

  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.attach(contractAddress);
  */

  // check factoryAddress
  /*
  const factoryAddress = await instance.factoryAddress();
  console.log("factoryAddress address:", factoryAddress);
  */

  const providerUrl = "https://rpc.degen.tips";
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);

  const blockNumber = await provider.getBlockNumber();
  console.log("blockNumber:", blockNumber);

  // get chainId
  const chainId = await provider.getNetwork();
  console.log("chainId:", chainId);

  const nonce = await provider.getTransactionCount(eoa);
  console.log("nonce:", nonce);

  const pending = await provider.getTransactionCount(eoa, "pending");
  console.log("pending:", pending);

  const balance = await provider.getBalance(eoa);
  // print balance in ether
  console.log("balance:", ethers.utils.formatEther(balance));

  /*
  const intrfc = new ethers.utils.Interface([
    "function counter() external view returns (uint256)",
    "function highestBid() external view returns (uint256)",
  ]);

  const contract = new ethers.Contract(eoa, intrfc, provider);
  const contract2 = new ethers.Contract(contractAddress, intrfc, provider);

  // call contract2 function counter
  //const counter = await contract2.counter();
  //console.log("counter:", counter.toString());
  */

  /*
  const tokenAddress = "0x2B3006D34359F3C23429167a659b18cC9c6F8bcA";

  // read bytecode from contract
  const bytecode = await provider.getCode(tokenAddress);
  console.log("bytecode:", bytecode);

  
  const tokenInterface = new ethers.utils.Interface([
    "function balanceOf(address) external view returns (uint256)",
  ]);
  const tokenContract = new ethers.Contract(tokenAddress, tokenInterface, provider);

  const balanceOf = await tokenContract.balanceOf(eoa);
  console.log("balanceOf:", ethers.utils.formatUnits(balanceOf, 18));
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });