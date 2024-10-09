// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NAME = "Option";
const SYMBOL = "WOPT";

const OptionModule = buildModule("Option", (m) => {
  const name = m.getParameter("name", NAME);
  const symbol = m.getParameter("symbol", SYMBOL);

  const option = m.contract("OptionToken", [name, symbol], {
  });

  return { option };
});



export default OptionModule;
