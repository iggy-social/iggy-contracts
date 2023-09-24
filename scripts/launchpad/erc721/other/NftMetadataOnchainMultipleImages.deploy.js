// Deploy NftMetadata contract for multiple onchain images
// npx hardhat run scripts/launchpad/erc721/other/NftMetadataOnchainMultipleImages.deploy.js --network flare

const contractName = "NftMetadataOnchainMultipleImages";

const collectionPreviewImage = "https://bafkreihn7v7ugcu4yjnapsha3tij4cq7qatj2wjofpvxlkp6s4sl5nujn4.ipfs.w3s.link/";
const description = "Viewing Japanese landscapes through a film.";
const externalUrl = "https://flr.chat/nft/collection?id=0xC4CFd446b1AD6dc958c6C28f137B62CE03989E98";
const image = "https://bafkreihn7v7ugcu4yjnapsha3tij4cq7qatj2wjofpvxlkp6s4sl5nujn4.ipfs.w3s.link/"; // 1st image
const nftname = "et_puis BK";

const images = [
  "https://bafybeidim3mkbj4obd3cbf7fcrolioo2zpeha3xbzg2jvuajrtmvjk5lnq.ipfs.w3s.link/et_puisBK_2.jpg",
  "https://bafybeicbrgmgugbmk7g2nofbndysbq4pwezm65t6yjlyo7j32q3hgsxtxm.ipfs.w3s.link/et_puisBK_3.jpg",
  "https://bafybeif2gszl6ts4hmjdpdribflwakqtx5mljdfpqmobizrgjbumaksdwy.ipfs.w3s.link/et_puisBK_4.jpg",
  "https://bafybeigahpskfomwq3kfbklcdtatz3g5pun5rwatjje3i2rwye6ktanszq.ipfs.w3s.link/et_puisBK_5.jpg",
  "https://bafybeihgmzfxbtigxzzcvmfpr6atmkgvr54muzxq3ew3minfx6ofugwvhi.ipfs.w3s.link/et_puisBK_6.jpg",
  "https://bafybeif4rte6ltbcc3gfwvneqwwrxvoif26zjmcuhoyksxdcnpjjjpbsxm.ipfs.w3s.link/et_puisBK_7.jpg",
  "https://bafybeid5sn5wfmijo4ixlcvzqnnmpjqucqi7pf6mnr5upf7tg3zsiarzhy.ipfs.w3s.link/et_puisBK_8.jpg",
  "https://bafybeibpgwuchjkm42hwpbrujeglpp77diw4o6f27kjpihbrhfrndxfvzu.ipfs.w3s.link/et_puisBK_9.jpg",
  "https://bafybeigw6zhwvnmiy6t6dxhtjvfnmy2uv5iib7g465ii2pp7otjmbitmsq.ipfs.w3s.link/et_puisBK_10.jpg",
  "https://bafybeibjtypyvp5gjvldbbo7z4jnq52qw6if6cqgwwn32r526dygzdoyf4.ipfs.w3s.link/et_puisBK_11.jpg",
  "https://bafybeicamgpbio5fghlau4t6cajxemttsjmf3mcsueoen2ehybgdemm7jm.ipfs.w3s.link/et_puisBK_12.jpg",
  "https://bafybeigcgk54wvsrcqwk6rzwqxfri27u4th3rukcuhfhztp2dfncgtexiy.ipfs.w3s.link/et_puisBK_13.jpg",
  "https://bafybeiewptq3ylx32gckjxaxpg4gioro5hz2r74a6ut54wwkqzeas4dwxa.ipfs.w3s.link/et_puisBK_14.jpg",
  "https://bafybeibxscafzx2zizv3fcbewk7g4scvbfwd7pwyay2fpcw76ixov2dquy.ipfs.w3s.link/et_puisBK_15.jpg",
  "https://bafybeiahyzchhowf3chkbs26y3u743kz7eh4idogpbmad66lk7iulsondi.ipfs.w3s.link/et_puisBK_16.jpg",
  "https://bafybeic5wboyolq736quq4i3dm2qg7rei35ujst6nywwgrlxawrllz3sie.ipfs.dweb.link/et_puisBK_17.jpg",
  "https://bafybeiawebroia6j7qglx4dhlsev4slqtgu2mqjnepdi6ka6jtjmj762qy.ipfs.w3s.link/et_puisBK_18.jpg",
  "https://bafybeibscztchiurjtq2tzrjh5jtzpkoygmqsrmrqdat34o3amxsfkkzm4.ipfs.w3s.link/et_puisBK_19.jpg",
  "https://bafybeicneamma5bz2byzynk5re3rwklgglcmlk2xbqp3xcda3nd4sypmu4.ipfs.w3s.link/et_puisBK_20.jpg",
  "https://bafybeidznwxrql55ig4rumlv2tovfzcu2iaja66vy6lscfufeyxrbmgax4.ipfs.w3s.link/et_puisBK_21.jpg",
  "https://bafybeicom6nyaarxnxqk5kz66uxidhd2accwzi6oyxzgfzyrcvnfmrn7lq.ipfs.w3s.link/et_puisBK_22.jpg",
  "https://bafybeid2yip54zx4opmv2hzing6qxalzsugj5jhxjndktvwzpiaxnywemi.ipfs.w3s.link/et_puisBK_23.jpg",
  "https://bafybeihrxuqdzcdmxwkeggzm62rbjezgmeyyiya5xorwjmktrxyshw3neq.ipfs.w3s.link/et_puisBK_24.jpg",
  "https://bafybeifnw66wjbngkbybcqc4bes2f7pujt3r7qe6koqml3cyuo2xaiztoq.ipfs.w3s.link/et_puisBK_25.jpg",
  "https://bafybeihnlgdwhzityuro4jbcljd2eubqtpqc3o4qkbbolypp2wjhveqc3y.ipfs.w3s.link/et_puisBK_26.jpg"
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy(
    collectionPreviewImage,
    description, 
    externalUrl,
    image,
    nftname
  );
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // add images to contract via addImageToCollection() function
  for (let i = 0; i < images.length; i++) {
    console.log("Adding image", images[i]);
    const tx = await instance.addImageToCollection(images[i]);
    await tx.wait();
    sleep(2000);
  }

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address + ' "' + collectionPreviewImage + '" "' + description + '" "' + externalUrl + '" "' + image + '" "' + nftname + '"');
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