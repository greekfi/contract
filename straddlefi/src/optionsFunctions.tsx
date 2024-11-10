import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, WagmiProvider } from 'wagmi'
import { config } from './config'
import RedeemInterface from './optionRedeemPair';
import ExerciseInterface from './optionExercise';
import MintInterface from './optionMint';
import { Account } from './account';
import { WalletOptions } from './walletoptions';
import OptionCreator from './optionCreate';
import { Address } from 'viem';
import ReadContract from './sample';
import { Collapse, CollapseProps,  } from 'antd';
import { useState } from 'react';
import SelectOptionAddress from './optionGetAll';

const queryClient = new QueryClient()

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

function OptionsFunctions() {
  console.log("OptionsFunctions");
  console.log(config);

  const [optionAddress, setOptionAddress] = useState<Address>("0x0");
  const [collateralAddress, setCollateralAddress] = useState<Address>("0x0");
  const [considerationAddress, setConsiderationAddress] = useState<Address>("0x0");
  const [collateralDecimals, setCollateralDecimals] = useState<number>(0);
  const [considerationDecimals, setConsiderationDecimals] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);


    const items: CollapseProps['items'] = [
      {
        key: '1',
        label: 'Mint',
        children: <MintInterface optionAddress={optionAddress} collateralAddress={collateralAddress} collateralDecimals={collateralDecimals} isExpired={isExpired} />,
      },
      {
        key: '2',
        label: 'Exercise',
        children: <ExerciseInterface optionAddress={optionAddress} collateralAddress={collateralAddress} considerationAddress={considerationAddress} collateralDecimals={collateralDecimals} considerationDecimals={considerationDecimals} isExpired={isExpired} />,
      },
      {
        key: '3',
        label: 'Redeem',
        children: <RedeemInterface optionAddress={optionAddress} collateralDecimals={collateralDecimals} isExpired={isExpired} />,
      },
    ];

    return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
    <ConnectWallet />     
    <OptionCreator />
    
    <SelectOptionAddress setOptionAddress={setOptionAddress}  />
    <ReadContract 
    optionAddress={optionAddress} 
    setCollateralAddress={setCollateralAddress} 
    setConsiderationAddress={setConsiderationAddress} 
    setCollateralDecimals={setCollateralDecimals}
    setConsiderationDecimals={setConsiderationDecimals}
    setIsExpired={setIsExpired}
    />
    <Collapse items={items} defaultActiveKey={['1']} />;
    </QueryClientProvider>
    </WagmiProvider>
    )
}

export default OptionsFunctions;