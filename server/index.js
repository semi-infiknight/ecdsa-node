const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");


app.use(cors());
app.use(express.json());

const balances = {
  "85ecca1fbfb5f387bd86a8042b2c0b5d36354049": 100,
  "3a6cbbf35d157dbfec3d55a7784df4c43c3c3a05": 50,
  "2dde02d702c893af5effe7b20897a4dcf8c9773f": 75,
};

const privateKeys = {
  "bf01635d2b4df118bbd1a51cce7c179065c04b4b9a645e1140e7db427ad92cf0": "85ecca1fbfb5f387bd86a8042b2c0b5d36354049",
  "9dc98ca0de93d5d84c01c48a349c449da63680b7cb98324ff0c4b0517501ed1e": "3a6cbbf35d157dbfec3d55a7784df4c43c3c3a05",
  "c65440c79d296bfacda903fcf4b4b09dee149d087f469156855e2b821871f27d": "2dde02d702c893af5effe7b20897a4dcf8c9773f"
}

app.get("/balance/:privateKey", (req, res) => {
  const { privateKey } = req.params;
  const address = privateKeys[privateKey] || 0;
  const balance = balances[address] || 0;
  res.send({ balance, address });
});

app.post("/send", async (req, res) => {

  try {

  const { signature, hexMessage, recoveryBit, sender, recipient, amount } = req.body;

  // get signature, hash and recovery bit from client-sideand recover the address from signature

  const signaturePublicKey = secp.recoverPublicKey(hexMessage, signature, recoveryBit);
  const signatureAddressUint= keccak256(signaturePublicKey.slice(1)).slice(-20);
  const signatureAddress = toHex(signatureAddressUint);
  

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } 
  else if (signatureAddress !== sender) {
    res.status(400).send({message: "You are not the owner!"})
  }
  else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
} catch(error){
  console.log(error);
}
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
