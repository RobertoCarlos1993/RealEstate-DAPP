import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@material-ui/core";

// --- WEB3 depencies --
import web3 from "./web3";
import RS_Contract from "./RealEstate";
import ipfs from "./ipfs";

const useStyles = makeStyles({
  root: {
    maxWidth: 345,
  },
});

function App() {
  const classes = useStyles();

  const [account, setAccounts] = useState(null);
  const [propertyPrice, setPropertyPrice] = useState("");
  const [addressOwner, setAddressOwner]  = useState("");
  const [buffer, setBuffer] = useState(null);
  const [assets, setAssets] = useState([]);

  const fileDrop = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setBuffer(Buffer(reader.result));
    };
  };

  const getAccounts = async () => {
    const accounts = await web3.eth.getAccounts();
    setAccounts(accounts[0]);
  };

  const addProperty = () => {
    const options = {
      from: account,
      gasLimit: 5000000,
      gas: 5000000,
    };

    ipfs.add(buffer, (error, result) => {
      if (error) {
        console.error(error);
        return;
      }
      const hash = result[0].hash;

      RS_Contract.methods
        .addAsset(
          propertyPrice,
          addressOwner,
          hash
        )
        .send(options)
        .on("transactionHash", function (hash) {
          console.log(hash);
        })
        .on("confirmation", function (confirmationNumber, receipt) {
          console.log(confirmationNumber);
        })
        .on("receipt", function (receipt) {
          // receipt example
          console.log(receipt);
        })
        .on("error", (e) => {
          console.log(e);
        });
    });
  };

  const increasePropertyValue = async () => {
    const tx = await RS_Contract.methods.build(0, 3).send({ from: '0x25196125a16a5694d6490515AA965A2F856a2282' });
    console.log(tx);
  };

  const assetsCount = async () => {
    const result = await RS_Contract.methods.getAssetsSize().call();
    console.log("Amount of assets: " + result);
    const result2 = await RS_Contract.methods
      .balanceOf()
      .call({ from: account });
    console.log("The following address: " + account + " owns: " + result2);
  };

  const assetDetails = async () => {
    const assets = await RS_Contract.methods.allAssets().call();
    setAssets(assets);
  };

  const onwerProperty = async(id) => {
    const owner = await RS_Contract.methods.ownerOf(id).call();
  }

  useEffect(() => {
    getAccounts();
  }, []);

  return (
    <div className="App">
      <TextField
        id="price-input"
        label="Price(ETH)"
        onChange={(e) => setPropertyPrice(parseInt(e.target.value))}
      />
      <TextField
        id="address-input"
        label="Address"
        onChange={(e) => setAddressOwner(e.target.value)}
      />
      <input type="file" onChange={(e) => fileDrop(e)} />
      <Button variant="contained" onClick={() => addProperty()}>
        Add Property
      </Button>

      <Button variant="contained" onClick={() => increasePropertyValue()}>
        Increase Property Value(0)
      </Button>

      <Button variant="contained" onClick={() => assetsCount()}>
        Check Asset Amount
      </Button>

      <Button variant="contained" onClick={() => assetDetails()}>
        Expose all assets
      </Button>

      {assets.map((el) => {
        return (
          <Card className={classes.root} key={el.assetId}>
            <CardActionArea>
              <CardMedia
                component="img"
                alt="Contemplative Reptile"
                height="140"
                image={`https://ipfs.io/ipfs/${el.cid}`}
                title="Contemplative Reptile"
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Price: {el.price} ETH
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  ID: {el.assetId}
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions>
              <Button size="small" color="primary">
                Buy
              </Button>
              <Button size="small" color="primary" onClick={() => onwerProperty(el.assetId)}>
                Expose Owner
              </Button>
            </CardActions>
          </Card>
        );
      })}
    </div>
  );
}

export default App;
