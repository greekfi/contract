// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import MetaMaskERC20Balance from './MetaMaskERC20Balance';
import ERC20OptionForm from './ERC20OptionForm';
// import TokenOptionComponent from './OptionCreate';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
          <MetaMaskERC20Balance />
          {/* <TokenOptionComponent /> */}
          <ERC20OptionForm />
    </>
  )
}

export default App
