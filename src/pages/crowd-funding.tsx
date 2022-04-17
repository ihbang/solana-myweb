import type { NextPage } from 'next';
import Head from 'next/head';
import { CrowdfundingView } from '../views';

const Basics: NextPage = props => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta name="description" content="Crowdfunding" />
      </Head>
      <CrowdfundingView />
    </div>
  );
};

export default Basics;
