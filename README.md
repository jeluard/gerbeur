A simple wrapper library on top of [PolkadotJS](https://polkadot.js.org/docs/)

## Example

```js
import { Uniques } from "gerbeur";
import { ApiPromise, WsProvider } from "@polkadot/api";

ApiPromise.create({ provider: new WsProvider("wss://statemine-rpc.polkadot.io") }).then(async (api: ApiPromise) => {
  const uniques = new Uniques(api);
  const collection = uniques.collection(11);
  const metadata = await collection.getMetadata();
  console.log(metadata);
});
```

## Push a new release

```
yarn clean && yarn && yarn build
yarn publish
```