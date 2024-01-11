// npx hardhat run scripts/activity-points/calls.js --network zkfair

const contractName = "ActivityPoints";

const apAddress = "0xc486B08Ed47fFe5c1b4b1A2ff5c671EA0083D9bA";

async function main() {
  const [caller] = await ethers.getSigners();

  console.log("Calling functions with the account:", caller.address);
  console.log("Account balance:", (await caller.getBalance()).toString());

  const apContract = await ethers.getContractFactory(contractName);
  const apInstance = await apContract.attach(apAddress);

  // get current multiplier
  const currentMultiplierBefore = await apInstance.multiplier();
  console.log("Current multiplier (before):", currentMultiplierBefore.toString());

  // set new multiplier
  const newMultiplier = 100;

  /*
  console.log("Setting new multiplier...");
  const tx1 = await apInstance.setMultiplier(newMultiplier);
  await tx1.wait();

  // get current multiplier
  const currentMultiplierAfter = await apInstance.multiplier();
  console.log("Current multiplier (after):", currentMultiplierAfter.toString());
  */

  // getPoints for caller
  const pointsCaller = await apInstance.getPoints("0xb29050965A5AC70ab487aa47546cdCBc97dAE45D");
  console.log("Points for caller:", ethers.utils.formatEther(pointsCaller));

  // getTotalWeiSpentAllUsers
  const totalPointsAllUsers = await apInstance.getTotalPointsAllUsers();
  console.log("Total points of all users:", ethers.utils.formatEther(totalPointsAllUsers));

  // check statsAddress
  const statsAddress = await apInstance.statsAddress();
  console.log("Stats address:", statsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });