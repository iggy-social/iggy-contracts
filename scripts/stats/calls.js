// npx hardhat run scripts/stats/calls.js --network zkfair

const statsMiddlewareAddress = "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Calling methods with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // create stats middleware contract
  const statsMiddlewareContract = await ethers.getContractAt("StatsMiddleware", statsMiddlewareAddress);

  // get stats contract address
  const statsAddress = await statsMiddlewareContract.statsAddress();
  console.log("Stats address:", statsAddress);

  // create stats contract
  const statsContract = await ethers.getContractAt("Stats", statsAddress);

  // Check if this address is a writer
  const swapAddress = "0xe69FD53b8C0F2F764cFe5929CAb5e213c0328b42";
  const isWriter = await statsMiddlewareContract.writers(swapAddress);
  console.log("Is writer: ", isWriter);

  // Add this address to the Stats middleware contract
  /*
  console.log("Adding this address to the stats middleware contract:");
  const tx1 = await statsMiddlewareContract.addWriter(swapAddress);
  await tx1.wait();
  */

  console.log("Done!");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });