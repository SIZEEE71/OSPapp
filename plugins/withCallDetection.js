const { withMainApplication, withDangerousMod, withAndroidManifest, AndroidConfig, createRunOncePlugin, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODULE_CLASS_NAME = 'CallDetectorModule';
const PACKAGE_CLASS_NAME = 'CallDetectorPackage';
const SUPPORT_LIB_MARKER = 'with-call-detection: support exclusions';
const SUPPORT_LIB_EXCLUSION_BLOCK = `// ${SUPPORT_LIB_MARKER}
configurations.all {
  exclude group: 'com.android.support', module: 'support-compat'
  exclude group: 'com.android.support', module: 'support-core-utils'
  exclude group: 'com.android.support', module: 'support-media-compat'
  exclude group: 'com.android.support', module: 'support-v4'
  exclude group: 'com.android.support', module: 'customview'
}
`;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createModuleContent(packageName) {
  // UWAGA: Używamy tutaj nazwy pakietu w oryginalnej wielkości liter, aby uniknąć problemów na Windowsie
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
  private CallStateListener callStateListener; // Zmieniono na nazwaną klasę wewnętrzną
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

    // Używamy nazwanej klasy zamiast anonimowej, aby uniknąć błędu "Nest Host" w D8
    callStateListener = new CallStateListener();

    telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_CALL_STATE);
    isListening = true;
  }

  private void tearDownListener() {
    if (telephonyManager != null && callStateListener != null) {
      telephonyManager.listen(callStateListener, PhoneStateListener.LISTEN_NONE);
      callStateListener = null;
    }
    isListening = false;
  }

  // Klasa wewnętrzna zamiast anonimowej
  private class CallStateListener extends PhoneStateListener {
    @Override
    public void onCallStateChanged(int state, String incomingNumber) {
      handleCallStateChanged(state, incomingNumber);
    }
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

function addJavaImport(contents, importStatement) {
  if (contents.includes(importStatement)) {
    return contents;
  }
  return contents.replace(/(package\s+[\w.]+;\s+)/, `$1${importStatement}\n`);
}

function addReactPackage(contents, packageStatement, packageName) {
  if (contents.includes('CallDetectorPackage')) {
    return contents;
  }
  // Handle both Java and Kotlin syntax
  if (/return packages;/.test(contents)) {
    // Java syntax
    return contents.replace(/return packages;/, `${packageStatement}\n    return packages;`);
  } else if (/\.packages\.apply \{/.test(contents)) {
    // Kotlin syntax - use fully qualified name
    const kotlinPackage = `add(${packageName}.calldetector.${PACKAGE_CLASS_NAME}())`;
    return contents.replace(/\.packages\.apply \{/, `.packages.apply {\n              ${kotlinPackage}`);
  }
  return contents;
}

function ensureSupportLibExclusion(buildGradleContents) {
  if (buildGradleContents.includes(SUPPORT_LIB_MARKER)) {
    return buildGradleContents;
  }
  return `${buildGradleContents.trimEnd()}\n\n${SUPPORT_LIB_EXCLUSION_BLOCK}`;
}

function withCallDetection(config) {
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults;
    manifest.manifest.$ = manifest.manifest.$ || {};
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    mainApplication.$ = mainApplication.$ || {};
    mainApplication.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    const replaceAttr = mainApplication.$['tools:replace'];
    const replaceValues = new Set(
      (replaceAttr ? replaceAttr.split(',') : [])
        .map((value) => value.trim())
        .filter(Boolean)
    );
    replaceValues.add('android:appComponentFactory');
    mainApplication.$['tools:replace'] = Array.from(replaceValues).join(',');

    return modConfig;
  });

  config = withMainApplication(config, (modConfig) => {
    // USUNIĘTO toLowerCase() - zachowujemy oryginalną nazwę pakietu
    const packageName = modConfig.android?.package || 'com.osp.app';
    const importName = `${packageName}.calldetector.${PACKAGE_CLASS_NAME}`;
    
    // Check if file is Kotlin (.kt) or Java (.java)
    const isKotlin = modConfig.modResults.path && modConfig.modResults.path.endsWith('.kt');
    
    if (!isKotlin) {
      // Java - add import
      modConfig.modResults.contents = addJavaImport(
        modConfig.modResults.contents,
        `import ${importName};`
      );
    }
    
    modConfig.modResults.contents = addReactPackage(
      modConfig.modResults.contents,
      `packages.add(new ${PACKAGE_CLASS_NAME}());`,
      packageName
    );
    return modConfig;
  });

  config = withDangerousMod(config, ['android', (modConfig) => {
    // USUNIĘTO toLowerCase() - generujemy pliki w ścieżce zgodnej z pakietem
    const packageName = modConfig.android?.package || 'com.osp.app';
    const projectRoot = modConfig.modRequest.projectRoot;
    const packagePath = packageName.split('.'); // Bez toLowerCase()
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

    // Przekazujemy oryginalną nazwę pakietu (z dużymi literami jeśli są)
    fs.writeFileSync(modulePath, createModuleContent(packageName), 'utf8');
    fs.writeFileSync(packagePathFile, createPackageContent(packageName), 'utf8');

    return modConfig;
  }]);

  config = withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = ensureSupportLibExclusion(modConfig.modResults.contents);
    return modConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(withCallDetection, 'with-call-detection', '1.0.0');