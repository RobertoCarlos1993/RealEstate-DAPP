import Contract_JSON from "./abis/RealEstate.json";        
import web3 from './web3';

const contract = new web3.eth.Contract(Contract_JSON.abi, Contract_JSON.networks["5777"].address);

export default contract;