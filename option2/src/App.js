// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

// import React from 'react';
// import MetaMaskERC20Balance from './MetaMaskERC20Balance';

// function App() {
//   return (
//     <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
//       <div className="relative py-3 sm:max-w-xl sm:mx-auto">
//         <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
//         <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
//           <h1 className="text-2xl font-bold mb-5 text-center">My DApp</h1>
//           <MetaMaskERC20Balance />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;






// import React, { useState, useEffect } from 'react';
// import logo from './logo.svg';
// import './App.css';

// import { ethers } from "ethers";
// import abi from './abi.json';

// const contractAddress = "0xF8d99FcadE2E7F4002D23CF6685DcC58ed1B89F6";

// function App() {
//   const [userBalance, setUserBalance] = useState(null);

//   useEffect(() => {
//     const fetchBalance = async () => {
//       try {
//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const contract = new ethers.Contract(contractAddress, abi, provider);
//         console.log(contract);
        
//         const balance = await contract.balanceOf("0x85EF30daC91A6562e6CC44611e941A5D5A74Aa27");
//         setUserBalance(balance.toString()); // Convert balance to a string for display
//       } catch (error) {
//         console.error("Error fetching balance:", error);
//       }
//     };

//     fetchBalance();
//   }, []); // Empty dependency array ensures this runs only once

//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           {userBalance ? `Balance: ${userBalance}` : 'Fetching balance...'}
//         </p>
//       </header>
//     </div>
//   );
// }

// export default App;

import React from 'react';
import MetaMaskERC20Balance from './MetaMaskERC20Balance';
import ERC20OptionForm from './ERC20OptionForm';
import TokenOptionComponent from './option';


function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-2xl font-bold mb-5 text-center">My DApp</h1>
          <MetaMaskERC20Balance />
          <TokenOptionComponent />
          <div className="mt-8">
            <ERC20OptionForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;