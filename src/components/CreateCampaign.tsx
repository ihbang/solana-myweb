import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { FC, useState } from 'react';
import { notify } from '../utils/notifications';
import { deserialize, serialize } from 'borsh';

export const CreateCampaign: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [creating, setCreating] = useState(false);

  class CampaignDetails {
    constructor(props) {
      Object.keys(props).forEach(key => {
        this[key] = props[key];
      });
    }
    static schema = new Map([
      [
        CampaignDetails,
        {
          kind: 'struct',
          fields: [
            ['admin', [32]],
            ['name', 'string'],
            ['description', 'string'],
            ['image_link', 'string'],
            ['amount_donated', 'u64'],
          ],
        },
      ],
    ]);
  }

  const createCampaign = async (name, description, image_link) => {
    if (!publicKey) {
      notify({ type: 'error', message: `Wallet not connected!` });
      console.log('error', `Send Transaction: Wallet not connected!`);
      return;
    }
    const seed = 'create_campaign' + Math.random().toString();
    const programId = new PublicKey(
      'EnjTYMmXHJ9bcjxN5CxxgGvAhjRAzgSQjmvRTV3vZnww',
    );
    let signature = '';

    try {
      const newAccount = await PublicKey.createWithSeed(
        publicKey,
        seed,
        programId,
      );

      const campaign = new CampaignDetails({
        name: name,
        description: description,
        image_link: image_link,
        admin: publicKey.toBuffer(),
        amount_donated: 0,
      });

      const serialized_data = serialize(CampaignDetails.schema, campaign);
      const data = new Uint8Array([0, ...serialized_data]);

      const lamports = await connection.getMinimumBalanceForRentExemption(
        data.length,
      );

      const createProgramAccount = SystemProgram.createAccountWithSeed({
        fromPubkey: publicKey,
        basePubkey: publicKey,
        newAccountPubkey: newAccount,
        seed,
        lamports,
        space: data.length,
        programId,
      });

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: newAccount, isSigner: false, isWritable: true },
        ],
        programId,
        data: Buffer.from(data),
      });

      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      });
      transaction.add(createProgramAccount);
      transaction.add(instruction);

      const signedTransaction = await signTransaction(transaction);
      signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
      );
      await connection.confirmTransaction(signature, 'confirmed');
      notify({
        type: 'success',
        message: 'Transaction successful!',
        txid: signature,
      });
    } catch (error: any) {
      notify({
        type: 'error',
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      console.log('error', `Transaction failed! ${error?.message}`, signature);
      return;
    }
  };

  const onClick = () => {
    if (!publicKey) {
      notify({ type: 'error', message: `Wallet not connected!` });
      console.log('error', `Send Transaction: Wallet not connected!`);
      return;
    }
    setCreating(!creating);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = event.target[0].value;
    const description = event.target[1].value;
    const image_link = event.target[2].value;
    await createCampaign(name, description, image_link);
  };

  return (
    <div>
      <button
        className="group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... "
        onClick={onClick}
        disabled={!publicKey}
      >
        <div className="hidden group-disabled:block ">Wallet not connected</div>
        <span className="block group-disabled:hidden">Create Campaign</span>
      </button>
      <form className="" hidden={!creating} onSubmit={onSubmit}>
        <input
          type={'text'}
          className="block mx-auto my-1 bg-transparent border-2 border-violet-400 border-solid rounded text-center input-sm"
          placeholder="Campaign name"
        ></input>
        <textarea
          className="block mx-auto my-1 bg-transparent border-2 border-violet-400 border-solid rounded text-center textarea"
          placeholder="Description"
        ></textarea>
        <input
          type={'url'}
          className="block mx-auto my-1 bg-transparent border-2 border-violet-400 border-solid rounded text-center input-sm"
          placeholder="Cover image URL"
        ></input>
        <button className="w-20 btn-xs rounded bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... ">
          Create
        </button>
      </form>
    </div>
  );
};
