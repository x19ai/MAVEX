interface PhantomProvider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: ArrayBuffer }>
}

interface Window {
  solana?: {
    phantom?: PhantomProvider
  }
  phantom?: {
    solana?: PhantomProvider
  }
} 