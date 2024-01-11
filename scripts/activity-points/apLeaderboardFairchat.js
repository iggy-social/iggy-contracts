// npx hardhat run scripts/activity-points/apLeaderboardFairchat.js --network zkfair

const contractName = "ActivityPoints";

const apAddress = "0xc486B08Ed47fFe5c1b4b1A2ff5c671EA0083D9bA";
const resolverAddress = "0xeA2f99fE93E5D07F61334C5Eb9c54c5D5C957a6a";
const tld = ".fairchat";

const addresses = [
  "0xe7D358c169789dC794f0bd411aa2897209675D72",
  "0x330232Ec8bae141CbA1116bD49E6bc6c191520B5",
  "0xb8234960308eEC310eE05E6A8A3AfA9727D0b47B",
  "0x462B6A0A8fc932C21A18fCca5Bb17Ab8FeBbD2A9",
  "0x3A1F7fAA40c93Be8e4A3f76b7e910Dcd8776cf76",
  "0x2e06842A6Bf721caa2463e3A5Bb56CbaCD255612",
  "0xb75Da0c0280dD1e01f5a2dd6a8574f34696723bF",
  "0x8b91FC90B38F0592460d34F5738f8cC3fE7d5708",
  "0x63feA96fbfa64EA4A1d56072Dbcea70F136aC754",
  "0x250517C5AbBd54B9D2f88dfBc6DD8f3b55cA1D10",
  "0xa00431795AcDCbA4BA0bC1DB12fE755963eBdFFa",
  "0x0D8DEC825e73979Eacf1a713F1985BE7509756Cc",
  "0xbCfA5A4E62649A040378f7536044C2A1a9EA81E4",
  "0xFd6aeE13B037fe2644dBFF826e3642338A205907",
  "0xF17135dDde942EA02BDE97eBE530557049265D40",
  "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D",
  "0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18",
  "0x6771F33Cfd8C6FC0A1766331f715f5d2E1d4E0e2",
];

async function main() {
  const [caller] = await ethers.getSigners();

  console.log("GENERATE AP LEADERBOARD");
  console.log("Calling functions with the account:", caller.address);

  const apContract = await ethers.getContractFactory(contractName);
  const apInstance = await apContract.attach(apAddress);

  const resolverInterface = new ethers.utils.Interface([
    "function getDefaultDomain(address _addr, string calldata _tld) public view returns(string memory)",
  ]);
  const resolverInstance = new ethers.Contract(resolverAddress, resolverInterface, caller);

  // get current multiplier
  const multiplier = await apInstance.multiplier();
  console.log("AP multiplier:", multiplier.toString());

  await sleep(1000);

  // getTotalWeiSpentAllUsers
  const totalPointsAllUsers = await apInstance.getTotalPointsAllUsers();
  console.log("Total points of all users:", ethers.utils.formatEther(totalPointsAllUsers));

  await sleep(1000);

  console.log();
  console.log("-------");
  console.log();

  let leaderboard = [];

  for (let i = 0; i < addresses.length; i++) {
    await sleep(1000);
    let username = await resolverInstance.getDefaultDomain(addresses[i], tld);

    if (username) {
      username = username + tld;
    }

    let points = await apInstance.getPoints(addresses[i]);
    console.log(username + " (" + addresses[i] + "): " + ethers.utils.formatEther(points));

    leaderboard.push({
      username: username,
      address: addresses[i],
      points: ethers.utils.formatEther(points),
    });
    
  }
  
  // sort leaderboard by points from highest to lowest
  leaderboard.sort((a, b) => b.points - a.points);

  console.log();
  console.log("-------");
  console.log();

  // print as csv
  console.log("username,address,points");
  for (let i = 0; i < leaderboard.length; i++) {
    console.log(leaderboard[i].username + "," + leaderboard[i].address + "," + leaderboard[i].points);
  }

  console.log();
  console.log("END");

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