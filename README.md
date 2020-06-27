# For testing the [react-native-zip-archive](https://github.com/mockingbot/react-native-zip-archive) moudle

## Up and running
```sh
yarn start
yarn run ios # for ios
yarn run android # for android, ensure the emulator is running
```

_**Be sure to run the `yarn start` manually, otherwise the bundling would fail.**_

## Test react-native-zip-archive locally
Since we use [haul](https://github.com/callstack/haul) to bundle things up, just link the react-native-zip-archive like you would do for a common node module development.
```sh
# in the react-native folder
yarn link
# in this demo app folder
yarn link react-native-zip-archive