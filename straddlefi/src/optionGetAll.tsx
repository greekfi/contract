import { useReadContract } from 'wagmi';
import { Select, Card, Space } from 'antd';
import { Address } from 'viem';


// Import ABIs and addresses
import OptionFactoryABI from '../../contracts/artifacts/OptionFactory_metadata.json';

const abi = OptionFactoryABI.output.abi;

const SelectOptionAddress = (
  {baseContractAddress, setOptionAddress}: 
  {baseContractAddress: Address, setOptionAddress: (address: Address) => void}
) => {

    const useOption = (optionAddress: string) => {
        setOptionAddress(optionAddress as Address);
      };

  const { data: createdOptions, error } = useReadContract({
    address: baseContractAddress, 
    abi,
    functionName: 'getCreatedOptions',
  });
  console.log("createdOptions", createdOptions);
  console.log("error", error);

  return (
    <Card title="Select Option">
    <Space direction="vertical" style={{ width: '100%' }}>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
  <Select 
    onChange={useOption} 
    options={ (createdOptions as Address[] || []).map((option) => ({label: option, value: option}))}
    />
    </Space>
    </Space>
    </Card>
  );
};

export default SelectOptionAddress;
