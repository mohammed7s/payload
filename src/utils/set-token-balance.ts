import { JsonRpcProvider, solidityPackedKeccak256, Contract } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

/**
 * Sets an ERC20 token balance for a wallet on a forked network (Anvil/Hardhat)
 * This works by directly manipulating the storage slots of the forked contract.
 *
 * @param provider - The JSON-RPC provider for the forked network
 * @param walletAddress - The address to give tokens to
 * @param tokenAddress - The ERC20 token contract address
 * @param balance - The balance to set (in wei/smallest unit)
 */
export async function setTokenBalance(
  provider: JsonRpcProvider,
  walletAddress: string,
  tokenAddress: string,
  balance: bigint,
): Promise<void> {
  // Format balance as 32-byte hex string
  const balanceFormatted = `0x${balance.toString(16).padStart(64, '0')}`;

  // Get token contract
  const erc20 = new Contract(tokenAddress, ERC20_ABI, provider);

  /**
   * Attempt to change ERC20 balance with a specific storage slot
   */
  const attemptERC20BalanceChange = async (storageSlot: string): Promise<boolean> => {
    // Get storage before modification
    const before: string = await provider.send('eth_getStorageAt', [
      tokenAddress,
      storageSlot,
      null,
    ]);

    // Set storage slot to new balance
    await provider.send('hardhat_setStorageAt', [
      tokenAddress,
      storageSlot,
      balanceFormatted,
    ]);

    // Check if token balance actually changed
    const newBalance = await erc20.balanceOf(walletAddress);
    if (newBalance === balance) {
      console.log(`✓ Successfully set token balance for slot: ${storageSlot}`);
      return true;
    }

    // Restore storage before trying next slot
    await provider.send('hardhat_setStorageAt', [tokenAddress, storageSlot, before]);

    return false;
  };

  // Loop through storage slots to find the balance mapping
  let success = false;

  console.log(`Searching for balance storage slot for ${tokenAddress}...`);

  for (let i = 0; i < 100; i += 1) {
    // Try Solidity storage layout: keccak256(abi.encode(address, slot))
    if (
      await attemptERC20BalanceChange(
        solidityPackedKeccak256(['uint256', 'uint256'], [walletAddress, i]),
      )
    ) {
      success = true;
      console.log(`Found balance slot using Solidity layout at slot ${i}`);
      break;
    }

    // Try Vyper storage layout: keccak256(abi.encode(slot, address))
    if (
      await attemptERC20BalanceChange(
        solidityPackedKeccak256(['uint256', 'uint256'], [i, walletAddress]),
      )
    ) {
      success = true;
      console.log(`Found balance slot using Vyper layout at slot ${i}`);
      break;
    }
  }

  if (!success) {
    throw new Error(
      `Could not set token balance for ${tokenAddress}. ` +
      `Storage slot for balance mapping not found in first 100 slots.`
    );
  }

  // Verify the balance was set correctly
  const finalBalance = await erc20.balanceOf(walletAddress);
  console.log(`✓ Token balance set successfully: ${finalBalance.toString()}`);
}
