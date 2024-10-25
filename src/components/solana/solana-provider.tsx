'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'

require('@solana/wallet-adapter-react-ui/styles.css')

// * Dynamic Importing is just to improve the core web vitals, it simply delays the loading from the initial load.
// ! It might also solve the hydration errors we usually face with the WalletButton.
// * Since wallet are entirely on the client side, we can use dynamic import to load the WalletButton component later after the initial load.
export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})


// * This is the Solana Provider Component.
// * It does the following:
// * 1. Connects to the Solana network at the specified endpoint obtained form the useCluster hook.
// * 2. Connects to the wallet using the WalletProvider along with autoConnect=true which automatically connects to the wallet and onError callback to handle any errors.
// * 3. Wraps the WalletModalProvider around the children to provide the wallet modal to manage connecting/disconnecting wallets, etc.

// * useMemo() is used to cache the endpoint value to prevent unnecessary re-renders until the endpoint changes (cluster).
// * any changes to the cluster will trigger a re-render of the children components as well.
export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// * This hook is used to provide the AnchorProvider to the application.
// * It allows the application to interact with the Solana blockchain using the Anchor framework.
// * It uses the useConnection and useWallet hooks to get the connection and wallet respectively.
export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}