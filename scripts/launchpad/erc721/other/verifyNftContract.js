// npx hardhat run scripts/launchpad/erc721/other/verifyNftContract.js --network degen

const contractAddress = "0x0F75991d7FE39AbEa26c664048104da9A87d5CF8";

const constructorArgs = [
  "0x1EB2Adc19eB3Df26D84427Be11F1eB1887c6631c", // factory address
  "0x475bb7D16B94164BbE1DB0A99002B3e2CAF46EBA", // metadata address (0x475bb7D16B94164BbE1DB0A99002B3e2CAF46EBA, 0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e)
  "0x5193877dD31b569Fedf762308aFae70B9091b951", // minting fee receiver address
  "Machinations", // collection name
  "MACH", // collection symbol
  "20000000000000000", // minting fee percentage
  "2048000000000000000000" // ratio
];

async function main() {
  try {
    console.log("Starting the verification process...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
  } catch (error) {
    console.error(error);
  } finally {
    console.log("If automated verification did not succeed, try to verify the smart contract manually by running this command:");
    // TODO:
    console.log("npx hardhat verify --network " + network.name + " " + contractAddress + ' ' + constructorArgs[0] + ' ' + constructorArgs[1] + ' ' + constructorArgs[2] + ' "' + constructorArgs[3] + '" "' + constructorArgs[4] + '" "' + constructorArgs[5] + '" "' + constructorArgs[6] + '"');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });