import { useReadContract } from 'wagmi';
import { Select, Card, Space } from 'antd';
import { Address } from 'viem';


// Import ABIs and addresses
import OptionFactoryABI from '../../contracts/artifacts/OptionFactory_metadata.json';

const abi = OptionFactoryABI.output.abi;

const SelectOptionAddress = ({setOptionAddress}: {setOptionAddress: (address: Address) => void}) => {

    const useOption = (optionAddress: string) => {
        setOptionAddress(optionAddress as Address);
      };

  const { data: createdOptions, error } = useReadContract({
    address: "0x0dc40778e46d701209b809e7f3716673df3c4ebc", 
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
