import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, WagmiProvider } from 'wagmi'
import { config } from './config'
import RedeemPair from './optionRedeemPair';
import ExerciseInterface from './optionExercise';
import MintInterface from './optionMint';
import { Account } from './account';
import { WalletOptions } from './walletoptions';
import OptionCreator from './optionCreate';
import { Address } from 'viem';
import ContractDetails from './optionDetails';
import { Collapse, CollapseProps, Flex, Layout, Image, Menu  } from 'antd';
import { useState } from 'react';
import SelectOptionAddress from './optionGetAll';
import { Content, Footer } from 'antd/es/layout/layout';
import Link from 'antd/es/typography/Link';
import logo from './assets/straddle-logo-v1.svg';

const CONTRACT_ADDRESS = '0xb55edadc4a09f380cd4229c4075b9f44e3405585'
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
  const [shortAddress, setShortAddress] = useState<Address>("0x0");
  const [collateralAddress, setCollateralAddress] = useState<Address>("0x0");
  const [considerationAddress, setConsiderationAddress] = useState<Address>("0x0");
  const [collateralDecimals, setCollateralDecimals] = useState<number>(0);
  const [considerationDecimals, setConsiderationDecimals] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);


    const items: CollapseProps['items'] = [
      {
        key: '0',
        label: 'Create New Option',
        children: <OptionCreator baseContractAddress={CONTRACT_ADDRESS} />,
      },
      {
        key: '1',
        label: 'Select Option',
        children: <SelectOptionAddress baseContractAddress={CONTRACT_ADDRESS} setOptionAddress={setOptionAddress} />,
      },
      {
        key: '2',
        label: 'Mint',
        children: <MintInterface optionAddress={optionAddress} shortAddress={shortAddress} collateralAddress={collateralAddress} collateralDecimals={collateralDecimals} isExpired={isExpired} />,
      },
      {
        key: '3',
        label: 'Exercise',
        children: <ExerciseInterface optionAddress={optionAddress} shortAddress={shortAddress} collateralAddress={collateralAddress} considerationAddress={considerationAddress} collateralDecimals={collateralDecimals} considerationDecimals={considerationDecimals} isExpired={isExpired} />,
      },
      {
        key: '4',
        label: 'Redeem',
        children: <RedeemPair  optionAddress={optionAddress} shortAddress={shortAddress} collateralAddress={collateralAddress} collateralDecimals={collateralDecimals} isExpired={isExpired} />,
      },
    ];

    return (
      <Layout>
        <Content>
          
          <Flex
            vertical
            gap="middle"
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '24px',
              minHeight: '100vh'
            }}
          >
            <Menu mode="horizontal" style={{ display: 'flex', justifyContent: 'left', width: '100%' }} >
              <Menu.Item>
                <Image src={logo} alt="Straddle.fi" style={{ width: '40px', height: '40px' }} preview={false} />
              </Menu.Item>
              <Menu.Item>
                  <Link href="#about">About Straddle</Link>
              </Menu.Item>

              <Menu.Item>
                  <Link href="https://github.com/straddle-fi/whitepaper">Whitepaper</Link>
              </Menu.Item>


              <Menu.Item>
                  <Link href="mailto:hello@straddle.fi">Contact</Link>
              </Menu.Item>
            </Menu>
            <Image src={logo} alt="Straddle.fi" style={{ width: '100px', height: '100px' }} preview={false} />

            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                {/* Each child in its own div to maintain vertical flow */}
                <div><ConnectWallet /></div>
                
                
                <div>
                  <ContractDetails 
                    optionAddress={optionAddress}
                    setShortAddress={setShortAddress}
                    setCollateralAddress={setCollateralAddress}
                    setConsiderationAddress={setConsiderationAddress}
                    setCollateralDecimals={setCollateralDecimals}
                    setConsiderationDecimals={setConsiderationDecimals}
                    setIsExpired={setIsExpired}
                  />
                </div>
                
                <div>
                  <Collapse 
                    items={items} 
                    defaultActiveKey={['1']} 
                  />
                </div>
              </QueryClientProvider>
            </WagmiProvider>
          </Flex>

          <Footer>
            <div id="about">
              <p>
                Straddle.fi provides the only option protocol on Ethereum that collateralizes any 
              ERC20 token to a redeemable token and provides a fully on-chain option that is exercisable. 
              Both the collateral and the option are ERC20 tokens. 
              </p>
            </div>
            <span>Straddle.fi © 2024</span>
          </Footer>
        </Content>
      </Layout>
    );
  }
  
  export default OptionsFunctions;