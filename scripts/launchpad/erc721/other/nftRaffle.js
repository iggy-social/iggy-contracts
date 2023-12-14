// script to select 10 random winners from a list of NFT holders and creators
// npx hardhat run scripts/launchpad/erc721/other/nftRaffle.js --network scroll

const { ethers } = require("hardhat");

const nftContracts = [
  {"address": "0xF06f2Dd99661b970186d56EA1a0685761C17b8eF", "startId": 1 },
  {"address": "0x96dBE349c2028C5Fe479CB2f550e71572F1b1c37", "startId": 1 },
  {"address": "0x1dE2C37C0cf63FeF18D278038D16c2C1D2b4e53F", "startId": 1 },
  {"address": "0xa9BD3C96B25D9dc4C9D2Dc00f4185608C0f5f8dF", "startId": 1 },
  {"address": "0xE4e2D31ABB4DdD278fCD50111DefC51bB2305b0E", "startId": 1 },
  {"address": "0x412E803AE9b993dF7ce1cc0e4518bCa54E4ecb84", "startId": 1 },
  {"address": "0x090c7b67f741c7e16b974F97650b6B6fdB0fE700", "startId": 1 },
  {"address": "0x72aEa1226a5CEcf1301913068F3fD4a428F568B7", "startId": 1 },
  {"address": "0x4011977b0C5F12E0A69D4EDb82b9bA2D9C3dB445", "startId": 1 },
  {"address": "0x12657039647c9ff3cB867D499AD8599A246e22c9", "startId": 1 },
  {"address": "0xA8E849F15D6Fb33e2b5DF2569Cfd57E5482E3a38", "startId": 1 },
];

// holder/creator addresses to exclude from the raffle
const excludedAddresses = [
  "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D",
  "0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18",
  "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2"
];

async function main() {
  let eligibleAddresses = [];

  for (let i = 0; i < nftContracts.length; i++) {
    sleep(1000);
    console.log("Contract", nftContracts[i].address);
    const nftContract = await ethers.getContractFactory("Nft721Bonding");
    const instance = nftContract.attach(nftContracts[i].address);

    // get contract owner
    const owner = await instance.owner();
    console.log("owner", owner);
    if (!excludedAddresses.includes(owner) && owner != ethers.constants.AddressZero) {
      console.log("adding owner", owner);
      eligibleAddresses.push(owner);
    }

    sleep(1000);

    // TODO!!!
    // if counter variable was not set to public (meaning you cannot call counter() view function), then
    // set a large enough counter value manually
    const counter = 100; //await instance.counter();

    for (let j = nftContracts[i].startId; j <= counter; j++) {
      try {
        sleep(1000);
        const holder = await instance.ownerOf(j);
        console.log("holder", holder);
        if (excludedAddresses.includes(holder) || holder == ethers.constants.AddressZero) {
          console.log("skipping", j);
          continue;
        }
        
        eligibleAddresses.push(holder);
      } catch (e) {
        console.log("Non-existent token ID:", j);
        break;
      }
    }
  }
  
  // remove duplicates
  eligibleAddresses = [...new Set(eligibleAddresses)];

  // if eligibleAddresses length is larger than 10, select 10 random addresses
  if (eligibleAddresses.length > 10) {
    eligibleAddresses = shuffle(eligibleAddresses);
    eligibleAddresses = eligibleAddresses.slice(0, 10);
  }

  console.log("eligibleAddresses", eligibleAddresses);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });