module.exports = {
  networks: {
   development: {
     host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
  },
  contracts_build_directory: '../interface/abis/',
  compilers: {
    solc: {
      version: "^0.5.8"
    }
  }
};
