// npx hardhat run scripts/staking/addStakingAddressToPostMinter.js --network songbird

const stakingContractAddress = "0xCA9749778327CD67700d3a777731a712330beB9A"; // staking contract address
const postMinterAddress = "0xeC5Af9F794B9f26bB62Cd951088445c95EAF428D"; // post minter contract address

async function main() {
  // create post minter contract instance
  const postMinterContract = await ethers.getContractFactory("IggyPostMinterV2");
  const postMinterContractInstance = await postMinterContract.attach(postMinterAddress);

  // fetch staking address before
  const stakingAddressBefore = await postMinterContractInstance.stakingAddress();
  console.log("Staking address before:", stakingAddressBefore);

  // set staking address
  const tx = await postMinterContractInstance.changeStakingAddress(stakingContractAddress);
  await tx.wait();

  // fetch staking address after
  const stakingAddressAfter = await postMinterContractInstance.stakingAddress();
  console.log("Staking address after:", stakingAddressAfter);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });