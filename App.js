/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  StyleSheet,
  TouchableHighlight,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {downloadFile, unlink, DocumentDirectoryPath} from 'react-native-fs';
import {
  unzip,
  unzipWithPassword,
  isPasswordProtected,
  subscribe as subscribeToZipArchive,
} from 'react-native-zip-archive';
import {
  Provider as PaperProvider,
  FAB,
  ProgressBar,
  Modal,
  Portal,
  Colors,
} from 'react-native-paper';

const App: () => React$Node = () => {
  const [progress, setProgress] = useState(0);
  const [isShowingProgress, toggleProgress] = useState(false);
  const [isShowingWebview, toggleWebview] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState(
    'https://github.com/mockingbot/react-native-zip-archive/',
  );

  function getFilename(path) {
    const filenameWithExt = path.split('/').pop();
    const filenameAsList = filenameWithExt.split('.');
    filenameAsList.pop();
    return filenameAsList.join('.');
  }

  async function start() {
    const remoteZipFileUrl =
      'https://rnza-test-app-assets.firebaseapp.com/static_password.zip';
    const zipFilePath = `${DocumentDirectoryPath}/static_password.zip`;
    const unzippedDir = `${DocumentDirectoryPath}/${getFilename(
      remoteZipFileUrl,
    )}`;

    console.log(zipFilePath, unzippedDir);

    try {
      await Promise.all([unlink(zipFilePath), unlink(unzippedDir)]);
    } catch (error) {}
    showProgress();
    const downloadPromise = downloadFile({
      fromUrl: remoteZipFileUrl,
      toFile: zipFilePath,
      progress: function({contentLength, jobId, bytesWritten}) {
        if (jobId === downloadPromise.jobId) {
          setProgress(bytesWritten / contentLength);
        }
      },
    });
    const downloadResult = await downloadPromise.promise;
    if (downloadResult.statusCode !== 200) {
      hideProgress();
      return;
    }
    subscribeToZipArchive(function({progress: unzipProgress, filePath}) {
      if (filePath.includes(unzippedDir)) {
        console.log(`unzipping to ${filePath}`);
        setProgress(unzipProgress);
      }
    });
    const isPasswordProtectedZip = await isPasswordProtected(zipFilePath);
    let unzipResult = '';
    try {
      if (isPasswordProtectedZip) {
        // TODO: prompt password dialog to user
        const password = 'helloworld';
        unzipResult = await unzipWithPassword(
          zipFilePath,
          DocumentDirectoryPath,
          password,
        );
      } else {
        unzipResult = await unzip(zipFilePath, DocumentDirectoryPath);
      }
    } catch (error) {
      console.log(`unzip error: ${error.userInfo.NSLocalizedDescription}`);
    }

    hideProgress();
    showWebview();
    setWebviewUrl(`file://${unzippedDir}/index.html`);
    console.log(`unzipped to ${unzipResult}`);

    unlink(zipFilePath);
  }

  function showProgress() {
    toggleProgress(true);
  }

  function hideProgress() {
    toggleProgress(false);
  }

  function showWebview() {
    toggleWebview(true);
  }

  function hideWebview() {
    toggleWebview(false);
  }

  return (
    <>
      <PaperProvider>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.full}>
          <View style={[styles.full, styles.center]}>
            <TouchableHighlight>
              <FAB onPress={start} icon="play" />
            </TouchableHighlight>
          </View>
          <Portal>
            <Modal
              visible={isShowingProgress}
              onDismiss={hideProgress}
              contentContainerStyle={styles.modal}>
              <ProgressBar progress={progress} color={Colors.blue900} />
            </Modal>
          </Portal>
          <Portal>
            <Modal
              visible={isShowingWebview}
              onDismiss={hideWebview}
              contentContainerStyle={styles.modal}>
              <WebView
                source={{uri: webviewUrl}}
                originWhitelist={['http://*', 'https://*', 'file://*']}
                startInLoadingState
                allowFileAccess
                onError={syntheticEvent => {
                  const {nativeEvent} = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                }}
              />
            </Modal>
          </Portal>
        </SafeAreaView>
      </PaperProvider>
    </>
  );
};

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    flex: 0,
    alignSelf: 'stretch',
    height: 400,
    paddingHorizontal: 40,
  },
});

export default App;
