# Iggy Social smart contracts

Smart contracts that enable and enhance the web3 social experience.

See the instructions below to run the code on localhost and for blockchain deployment.

### .env

Create a `.env` file with the following keys:

```bash
DEPLOYER_PRIVATE_KEY=enter-key-here
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

Run tests in a specific folder:

```bash
npx hardhat test test/*test.js
```

Run a specific test:

```bash
npx hardhat test test/some.test.js
```

### Run on localhost

Start a localhost node:

```bash
npx hardhat node
```

Make sure to add one of the private keys presented as deployer key in `.env` file.

In a separate terminal tab then run the following command:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Deployment

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

> Also make sure you have the `@nomiclabs/hardhat-etherscan` library `3.1.0` or above.

### Verify TLD contracts

Verifying TLD contracts generated through the factory is a bit tricky, but there is a way around the issue. See `scripts/temp/deployTld.js` for instructions.

## Audit tools

### Flatten the contracts

Most audit tools will require you to flatten the contracts. This means that all contracts that are defined under the imports will actually be imported into one .sol file, so all code is in one place.

First create a new folder called flattened:

```bash
mkdir flattened
```

To flatten a contract, run this command:

```bash
npx hardhat flatten <path-to-contract> >> flattened/<flat-contract-name>.sol
```

You may also need to give all contracts in the flattened file the same Solidity version. And you may need to delete all SPDX lines except the very first one.

### Mythrill

```bash
myth -v4 analyze flattened/PunkForbiddenTlds.sol
```

Flags:

- `v4`: verbose
- `o`: output
- `a`: address onchain
- `l`: automatically retrieve dependencies
- `max-depth`: maximum recursion depth

Docs: https://mythril-classic.readthedocs.io/en/master/security-analysis.html 

### Slither

Install Slither:

```bash
pip3 install slither-analyzer --user
```

Run it in the `flattened` folder:

```bash
slither .
```

Docs: https://github.com/crytic/slither

## Debugging

### Error: ENOENT: no such file or directory

Run `npx hardhat clean` and then `npx hardhat compile`.

## Frontends

- Development preview: https://iggy-social-frontend.vercel.app/
- Landing page: https://iggy.social
