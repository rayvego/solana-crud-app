'use client';

import {BASIC_PROGRAM_ID, BASIC_PROGRAM_ID as programId, getBasicProgram} from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { useMutation, useQuery } from '@tanstack/react-query'

import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import {PublicKey} from "@solana/web3.js";

interface CreateEntryArgs {
  title: string,
  message: string,
  owner: PublicKey
}

// This function is used to interact with the basic program.
export function useBasicProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();

  // Get the basic program from the provider.
  const program = getBasicProgram(provider);

  // We use tanstack query for all fetching operations.

  // Fetch all journal entries.
  const accounts = useQuery({
    queryKey: ["journal", "all", { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  });

  // Fetch the program account.
  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  // Create a new journal entry.
  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["journalEntry", "create", {cluster}],
    mutationFn: async ({title, message, owner}) => {
      // const [journalEntryAddress] = PublicKey.findProgramAddressSync(
      //   [Buffer.from(title), owner.toBuffer()],
      //   programId
      // );

      // Call the createJournalEntry method on the program. This will send a transaction to the network.
      return program.methods.createJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch()
    },
    onError: (error) => {
      toast.error(`Error creating journal entry: ${error.message}`)
    }
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createEntry
  }
}

// This is a function to interact with a specific journal entry.
export function useJournalProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useBasicProgram();
  const programId = new PublicKey(BASIC_PROGRAM_ID);

  // Fetch the journal entry for the given account.
  const accountQuery = useQuery({
    queryKey: ["journal", "fetch", { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  });

  // Update a journal entry.
  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["journalEntry", "update", { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      // const [journalEntryAddress] = await PublicKey.findProgramAddress(
      //   [Buffer.from(title), owner.toBuffer()],
      //   programId
      // );

      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update journal entry: ${error.message}`);
    },
  });

  // Delete a journal entry.
  const deleteEntry = useMutation({
    mutationKey: ["journal", "deleteEntry", { cluster, account }],
    mutationFn: (title: string) =>
      program.methods.deleteJournalEntry(title).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  };
}