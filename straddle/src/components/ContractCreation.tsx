import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import optionFactoryMetadata from '../OptionFactory_metadata.json';
// Contract ABI & address
const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS";
const FACTORY_ABI = optionFactoryMetadata.output.abi; // Add your factory contract ABI here

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface OptionFormData {
  collateralToken: Token | null;
  considerationToken: Token | null;
  amount: string;
  strikePrice: string;
  isCall: boolean;
  expiryDate: string;
}

// Helper function to calculate strike ratio
function calculateStrikeRatio(
  strikePrice: string,
  collateralDecimals: number,
  considerationDecimals: number,
  isCall: boolean
): { strikeNum: ethers.BigNumber; strikeDen: ethers.BigNumber } {
  try {
    // Convert strike price to a fraction
    const strikeBN = ethers.utils.parseUnits(strikePrice, 18); // Use 18 decimals for precision
    
    if (isCall) {
      // For calls: price = consideration/collateral
      const baseNum = ethers.BigNumber.from(10).pow(18 + considerationDecimals);
      const strikeDen = baseNum;
      const strikeNum = strikeBN.mul(ethers.BigNumber.from(10).pow(collateralDecimals));
      return { strikeNum, strikeDen };
    } else {
      // For puts: price = collateral/consideration (invert the ratio)
      const baseNum = ethers.BigNumber.from(10).pow(18 + collateralDecimals);
      const strikeNum = baseNum;
      const strikeDen = strikeBN.mul(ethers.BigNumber.from(10).pow(considerationDecimals));
      return { strikeNum, strikeDen };
    }
  } catch (error) {
    console.error('Error calculating strike ratio:', error);
    return {
      strikeNum: ethers.BigNumber.from(0),
      strikeDen: ethers.BigNumber.from(0)
    };
  }
}

export default function OptionsInterface() {
  const { library, account } = useWeb3React();
  const [formData, setFormData] = useState<OptionFormData>({
    collateralToken: null,
    considerationToken: null,
    amount: '',
    strikePrice: '',
    isCall: true,
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);

  // ... (previous token selection and form handling code remains the same)

  const createOption = async () => {
    if (!formData.collateralToken || !formData.considerationToken || !account || !library) {
      console.error('Missing required data');
      return;
    }

    try {
      setLoading(true);

      const signer = library.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      // Calculate expiry timestamp
      const expiryTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);

      // Calculate strike ratio
      const { strikeNum, strikeDen } = calculateStrikeRatio(
        formData.strikePrice,
        formData.collateralToken.decimals,
        formData.considerationToken.decimals,
        formData.isCall
      );

      // Generate option name and symbol
      const name = `${formData.collateralToken.symbol}/${formData.considerationToken.symbol} ${formData.isCall ? 'Call' : 'Put'} ${formData.strikePrice}`;
      const symbol = `${formData.collateralToken.symbol}${formData.considerationToken.symbol}${formData.isCall ? 'C' : 'P'}`;

      // Create option
      const tx = await factory.createOption(
        name,
        symbol,
        formData.collateralToken.address,
        formData.considerationToken.address,
        expiryTimestamp,
        strikeNum,
        strikeDen,
        !formData.isCall // Note: contract uses isPut, so we invert isCall
      );

      await tx.wait();
      
      // Handle success (e.g., show notification, reset form, etc.)
    } catch (error) {
      console.error('Error creating option:', error);
      // Handle error (show notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* ... (previous form elements remain the same) ... */}

      {/* Add Create Option Button */}
      <div className="mt-6">
        <button
          onClick={createOption}
          disabled={loading || !formData.collateralToken || !formData.considerationToken || !formData.amount || !formData.strikePrice || !formData.expiryDate}
          className={`w-full py-3 px-4 rounded-md text-white font-medium 
            ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Creating...' : `Create ${formData.isCall ? 'Call' : 'Put'} Option`}
        </button>
      </div>

      {/* Optional: Display calculated ratios for verification */}
      {formData.collateralToken && formData.considerationToken && formData.strikePrice && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm">
          <h3 className="font-medium mb-2">Contract Parameters:</h3>
          {(() => {
            const { strikeNum, strikeDen } = calculateStrikeRatio(
              formData.strikePrice,
              formData.collateralToken.decimals,
              formData.considerationToken.decimals,
              formData.isCall
            );
            return (
              <div>
                <p>Strike Numerator: {strikeNum.toString()}</p>
                <p>Strike Denominator: {strikeDen.toString()}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}