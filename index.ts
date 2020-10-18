import {AppRegistry} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

MaterialCommunityIcons.loadFont();

import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
