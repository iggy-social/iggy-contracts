// npx hardhat run scripts/mock/mockCreateGovernanceProposal.js --network flareCoston

const tokenAddress = "0x633Ae857445cF0cd02B21C6a3033C7CE74fB32c2"; // governance token contract address
const governorAddress = "0x06A7Ab7Bb68b0ad6eB7688C5781E60BE6AFc658d"; // governor contract address

const tokenReceiverAddress = "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D"; // address to receive tokens through governance proposal
const grantAmount = ethers.utils.parseEther("69"); // amount of tokens to send through governance proposal

async function main() {
  // create token instance
  const tokenContract = await ethers.getContractFactory("MockErc20TokenVotingBlock");
  const tokenContractInstance = await tokenContract.attach(tokenAddress);

  // create governor instance
  const governorContract = await ethers.getContractFactory("MockGovernorBlock");
  const governorContractInstance = await governorContract.attach(governorAddress);

  console.log("Make sure that deployer address has enough tokens delegated to, to send through governance proposal");

  // proposal to send some tokens from governor contract to another address
  const transferCalldata = tokenContractInstance.interface.encodeFunctionData("transfer", [tokenReceiverAddress, grantAmount]);

  /*
  const proposalId = await governorContractInstance.propose(
    [tokenAddress],
    [0],
    [transferCalldata],
    "Proposal #4: Give grant to team",
  );

  console.log(proposalId);
  */

  const proposalId2 = await governorContractInstance.hashProposal(
    [tokenAddress],
    [0],
    [transferCalldata],
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Proposal #4: Give grant to team")),
  );

  console.log(proposalId2);
  console.log(String(proposalId2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });