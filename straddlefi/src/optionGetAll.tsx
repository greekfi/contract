import { useReadContract } from 'wagmi';
import { Select } from 'antd';
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
            <Select onChange={useOption} options={ (createdOptions as Address[] || []).map((option) => ({label: option, value: option}))}></Select>
         
  );
};

export default SelectOptionAddress;
