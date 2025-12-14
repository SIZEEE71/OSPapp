const { withMainApplication, withDangerousMod, AndroidConfig, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODULE_CLASS_NAME = 'CallDetectorModule';
const PACKAGE_CLASS_NAME = 'CallDetectorPackage';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createModuleContent(packageName) {
  return `package ${packageName}.calldetector;

import android.content.Context;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class ${MODULE_CLASS_NAME} extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final String EVENT_NAME = "OSP_CALL_EVENT";

  private final ReactApplicationContext reactContext;
  private TelephonyManager telephonyManager;
  private PhoneStateListener phoneStateListener;
  private boolean isListening = false;
  private String targetNumber;

  public ${MODULE_CLASS_NAME}(ReactApplicationContext context) {
    super(context);
    this.reactContext = context;
    context.addLifecycleEventListener(this);
  }

  @NonNull
  @Override
  public String getName() {
    return "CallDetector";
  }

  @ReactMethod
  public void startListening(String number, Promise promise) {
    targetNumber = normalize(number);
    ensureListener();
    if (promise != null) {
      promise.resolve(null);
    }
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    tearDownListener();
    if (promise != null) {
      promise.resolve(null);
    }
  }

  private void ensureListener() {
    if (isListening) {
      return;
    }
    telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
    if (telephonyManager == null) {
      return;
    }

    phoneStateListener = new PhoneStateListener() {
      @Override
      public void onCallStateChanged(int state, String incomingNumber) {
        handleCallStateChanged(state, incomingNumber);
      }
    };

    telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
    isListening = true;
  }

  private void tearDownListener() {
    if (telephonyManager != null && phoneStateListener != null) {
      telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
    }
    isListening = false;
  }

  private void handleCallStateChanged(int state, String phoneNumber) {
    String normalizedNumber = normalize(phoneNumber);
    if (targetNumber != null && normalizedNumber != null) {
      if (!(normalizedNumber.endsWith(targetNumber) || normalizedNumber.equals(targetNumber))) {
        return;
      }
    }

    WritableMap payload = Arguments.createMap();
    payload.putString("state", stateToString(state));
    if (!TextUtils.isEmpty(normalizedNumber)) {
      payload.putString("number", normalizedNumber);
    }
    payload.putDouble("timestamp", System.currentTimeMillis());
    sendEvent(payload);
  }

  private String stateToString(int state) {
    switch (state) {
      case TelephonyManager.CALL_STATE_RINGING:
        return "RINGING";
      case TelephonyManager.CALL_STATE_OFFHOOK:
        return "OFFHOOK";
      case TelephonyManager.CALL_STATE_IDLE:
      default:
        return "IDLE";
    }
  }

  private void sendEvent(WritableMap data) {
    if (!reactContext.hasActiveCatalystInstance()) {
      return;
    }
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(EVENT_NAME, data);
  }

  private String normalize(String number) {
    if (TextUtils.isEmpty(number)) {
      return null;
    }
    return number.replace("+", "").replaceAll("[^0-9]", "");
  }

  @Override
  public void onHostResume() {
    if (isListening) {
      ensureListener();
    }
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {
    tearDownListener();
  }
}
`;
}

function createPackageContent(packageName) {
  return `package ${packageName}.calldetector;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ${PACKAGE_CLASS_NAME} implements ReactPackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ${MODULE_CLASS_NAME}(reactContext));
    return modules;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`;
}

function withCallDetection(config) {
  config = withMainApplication(config, (modConfig) => {
    const packageName = modConfig.android?.package || 'com.osp.app';
    const importName = `${packageName}.calldetector.${PACKAGE_CLASS_NAME}`;
    modConfig.modResults.contents = AndroidConfig.MainApplication.addImport(
      modConfig.modResults.contents,
      `import ${importName};`
    );
    modConfig.modResults.contents = AndroidConfig.MainApplication.addReactPackage(
      modConfig.modResults.contents,
      `new ${PACKAGE_CLASS_NAME}()`
    );
    return modConfig;
  });

  config = withDangerousMod(config, ['android', (modConfig) => {
    const packageName = modConfig.android?.package || 'com.osp.app';
    const projectRoot = modConfig.modRequest.projectRoot;
    const packagePath = packageName.toLowerCase().split('.');
    const javaDir = path.join(
      projectRoot,
      'android',
      'app',
      'src',
      'main',
      'java',
      ...packagePath,
      'calldetector'
    );

    ensureDir(javaDir);

    const modulePath = path.join(javaDir, `${MODULE_CLASS_NAME}.java`);
    const packagePathFile = path.join(javaDir, `${PACKAGE_CLASS_NAME}.java`);

    fs.writeFileSync(modulePath, createModuleContent(packageName.toLowerCase()), 'utf8');
    fs.writeFileSync(packagePathFile, createPackageContent(packageName.toLowerCase()), 'utf8');

    return modConfig;
  }]);

  return config;
}

module.exports = createRunOncePlugin(withCallDetection, 'with-call-detection', '1.0.0');
