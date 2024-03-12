// npx hardhat run scripts/stats/calls.js --network scroll

const statsMiddlewareAddress = "0xb61bed21a502519bF49DA543f84cEEFe0196dD2b";

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

  // Check if this contract address is a writer
  const contractAddr = "0x0E1ABbd03aeCDd832F7baA29E91085b7a8f2dFad";
  const isWriter = await statsMiddlewareContract.writers(contractAddr);
  console.log("Is writer: ", isWriter);

  // Add this address to the Stats middleware contract
  /**/
  console.log("Adding this address to the stats middleware contract:");
  const tx1 = await statsMiddlewareContract.addWriter(contractAddr);
  await tx1.wait();
  

  console.log("Done!");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });