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
import {
  downloadFile,
  unlink,
  DocumentDirectoryPath,
  writeFile,
  mkdir,
} from 'react-native-fs';
import {
  zipWithPassword,
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

  const remoteZipFileUrl =
    'https://rnza-test-app-assets.firebaseapp.com/static_password.zip';

  async function downloadArchive() {
    const zipFilePath = `${DocumentDirectoryPath}/${remoteZipFileUrl
      .split('/')
      .pop()}`;

    try {
      await unlink(zipFilePath);
    } catch (error) {}
    setProgressAndPrint(0);
    showProgress();
    const downloadPromise = downloadFile({
      fromUrl: remoteZipFileUrl,
      toFile: zipFilePath,
      progress: function({contentLength, jobId, bytesWritten}) {
        if (jobId === downloadPromise.jobId) {
          setProgressAndPrint(bytesWritten / contentLength);
        }
      },
    });
    const downloadResult = await downloadPromise.promise;
    if (downloadResult.statusCode !== 200) {
      hideProgress();
      throw new Error(downloadResult.statusCode);
    }
    return zipFilePath;
  }

  async function startArchiveTest() {
    const folder = `${DocumentDirectoryPath}/test`;
    try {
      await unlink(folder);
    } catch (error) {}
    try {
      await mkdir(folder);
      await writeFile(`${folder}/test1.txt`, 'this is a test1', 'utf8');
      await writeFile(`${folder}/test2.txt`, 'this is a test2', 'utf8');
      setProgressAndPrint(0);
      showProgress();
      const subscription = subscribeToZipArchive(function({
        progress: zipProgress,
        filePath,
      }) {
        console.log(`zipping to ${filePath}`);
        setProgressAndPrint(zipProgress);
      });
      await zipWithPassword(
        folder,
        `${DocumentDirectoryPath}/test.zip`,
        'password',
      );
      subscription.remove();
      setProgressAndPrint(1);
      hideProgress();
      unlink(folder);
      console.log(`zipped ${folder}`);
    } catch (error) {
      console.error(error);
    }
  }

  async function startUnzipTest() {
    setProgressAndPrint(0);
    const unzippedDir = `${DocumentDirectoryPath}/${getFilename(
      remoteZipFileUrl,
    )}`;

    try {
      const zipFilePath = await downloadArchive();
      unlink(unzippedDir);

      const subscription = subscribeToZipArchive(function({
        progress: unzipProgress,
        filePath,
      }) {
        console.log(`unzipping to ${filePath}`);
        setProgressAndPrint(unzipProgress);
      });
      const isPasswordProtectedZip = await isPasswordProtected(zipFilePath);
      if (isPasswordProtectedZip) {
        // TODO: prompt password dialog to user
        const password = 'helloworld';
        await unzipWithPassword(zipFilePath, DocumentDirectoryPath, password);
      } else {
        await unzip(zipFilePath, DocumentDirectoryPath);
      }
      subscription.remove();
      showWebview();
      setWebviewUrl(`file://${unzippedDir}/index.html`);
      unlink(zipFilePath);
    } catch (error) {
      console.error(error);
    }

    setProgressAndPrint(1);
    hideProgress();
  }

  function setProgressAndPrint(progress) {
    console.log(progress);
    setProgress(progress);
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
            <View style={styles.buttons}>
              <TouchableHighlight>
                <FAB
                  onPress={startUnzipTest}
                  icon="folder-open"
                  label="Unzip"
                />
              </TouchableHighlight>
              <TouchableHighlight>
                <FAB
                  onPress={startArchiveTest}
                  icon="zip-box"
                  label="Archive"
                  color={Colors.white}
                  style={{backgroundColor: Colors.deepPurpleA400}}
                />
              </TouchableHighlight>
            </View>
          </View>
          <Portal>
            <Modal
              visible={isShowingProgress}
              onDismiss={hideProgress}
              contentContainerStyle={styles.modal}>
              <ProgressBar progress={progress} color={Colors.purple900} />
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
  buttons: {
    height: 200,
    justifyContent: 'space-around',
  },
});

export default App;
