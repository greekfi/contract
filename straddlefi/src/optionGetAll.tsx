import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { Select, Card, Space } from 'antd';
import { Address, erc20Abi } from 'viem';


// Import ABIs and addresses
import OptionFactoryABI from '../../contracts/artifacts/OptionFactory_metadata.json';
import TokenBalance from './optionTokenBalance';

const abi = OptionFactoryABI.output.abi;

const SelectOptionAddress = (
  {baseContractAddress, setOptionAddress, optionAddress, collateralAddress, collateralDecimals}: 
  {baseContractAddress: Address, setOptionAddress: (address: Address) => void, optionAddress: Address, collateralAddress: Address, collateralDecimals: number}
) => {

    const useOption = (optionAddress: string) => {
        setOptionAddress(optionAddress as Address);
      };

      const { address: userAddress } = useAccount();
  const { data: createdOptions, error } = useReadContract({
    address: baseContractAddress, 
    abi,
    functionName: 'getCreatedOptions',
  });

  console.log("createdOptions", createdOptions);
  console.log("error", error);

  const { data, error:error_ } = useReadContracts({
    contracts: (createdOptions as Address[] || []).map((option: Address) => (option?{
      address: option,
      abi: erc20Abi,
      functionName: 'name',
    }: undefined)).filter((option) => option !== undefined),
    query: {
      enabled: !!createdOptions,
    }
  }) ;
  const optionNames = data || [];
  // combine option names with options
  const optionList = (optionNames || []).map((option, index) => ({
    name: option.result,
    address: (createdOptions as Address[] || [])[index],
    
  }));

  console.log("error", error_);
  console.log("optionList", optionList);

  return (
    <Card title="Select Option">
    <Space direction="vertical" style={{ width: '100%' }}>
    

      <Space style={{ width: '100%', justifyContent: 'space-between', justifyItems: 'center' }}>
  <Select 
  
    placeholder="Select an option"
    onChange={useOption} 
    options={ (optionList).map((option) => ({label: option.name || '', value: option.address || ''}))}
    style={{width: '400px', margin: 'auto', textAlign: 'center', display: 'block'}}
    />
    </Space>
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={optionAddress as `0x${string}`}
            label="Your Option Balance"
            decimals={collateralDecimals as number}
            watch={true}
          />
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={collateralAddress as `0x${string}`}
            label="Your Collateral Balance"
            decimals={collateralDecimals as number}
            watch={true}
          />
        </Space>
    </Space>
    </Card>
  );
};

export default SelectOptionAddress;
