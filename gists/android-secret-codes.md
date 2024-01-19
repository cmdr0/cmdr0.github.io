# Pulling "Secret Codes" from Android Phones

Android phones have different "secret codes" that, when typed into the dialer/phone app, activates an intent or an application.  For example, `*#06#` displays the IMEI(s) of your phone.  Phone manufacturers and carriers will often include other applications to do things such as contact support or display account information - though sometimes they're even used for technical support, to include sim card unlocking.  The following is how I pulled all of the apps that respond to secret codes and reversed them to find a list of codes for the phone I was working on.

Pre-requisites: Android debug bridge shell on the device.

## Identifying Packages that Care

I used `adb shell dumpsys package` and found a `Schemes` section with the following packages listed under `android_secret_code`:

```
com.android.deviceinformation/.ScretCodePopReceiver
com.android.mmitest/.receiver.SecretCodeReceiver
com.android.providers.calendar/.CalendarDebugReceiver
com.android.settings/com.android.vzw.ApnMiniCodeBroadcastReceiver
com.android.settings/com.tct.ApnSecretCodeReceiver
com.android.settings/com.tct.settings.network.CarrierChooseReceiver
com.android.settings/com.tct.settings.wifi.tether.HotspotEntitlementCheckReceiver
com.android.settings/com.tct.settings.wifi.WifiNetworkCheckReceiver
com.android.settings/.StopGoogleAppBroadcastReceiver
com.android.settings/.TestingSettingsBroadcastReceiver
com.google.android.cellbroadcastreceiver/com.android.cellbroadcastreceiver.CellBroadcastReceiver
com.google.android.dialer/com.android.dialer.incall.answer.paw.impl.PawSecretCodeReceiver_Receiver
com.google.android.dialer/com.android.voicemail.VoicemailSecretCodeReceiver
com.google.android.gm/com.android.email.service.EmailBroadcastReceiver
com.google.android.gms/.auth.authzen.cryptauth.DialerSecretCodeReceiver
com.google.android.gms/.checkin.CheckinServiceSecretCodeReceiver
com.google.android.gms/.chimera.GmsIntentOperationService$SecretCodeReceiver
com.google.android.gms/.games.chimera.GamesSystemBroadcastReceiverProxy
com.tcl.fota.system/.receiver.PhoneCodeReceiver
com.tcl.token/.receiver.SecretCodeReceiver
com.tct.cs.omadm/.receiver.DMSecretCodeReceiver
com.tct.display.resources/tct.display.TctAiBrightnessReceiver
com.tct.fcm/.SecRetCodeReceiver
com.tct.gcs.wfcmanager/.common.WFCMMIReceiver
com.tct.phone/.simlock.SimLockReceiver
com.tct.phone/.ui.DialerCodeReceiver
com.tct.reducesar/.SarConfReceiver
com.tct.secretCode/.SecretCodeReceiver
com.tct.smart.push/.receiver.ExitPushReceiver
com.tct.systemservice/.SecretCodeReceiver\
```

This doesn't guarantee that these packages listen for the secret codes intent, but it is a pretty good indication.  It's also not a guarantee that there aren't more apps that do, but this is a solid start, and just `grep`'ing or ctrl+f'ing for secret, secret_code, etc can find more (such as the following:)

```
  Non-Data Actions:
      android.provider.Telephony.SECRET_CODE:
        9e936fc com.android.settings/com.tct.UsbDebugBroadcastReceiver
```

## Pulling Packages

Using `pm list packages -f` to pull the APK path and using `adb pull` should allow you to pull the apk.  Example:

```
$ adb shell pm list packages -f | grep com.tct.secretCode
package:/system/priv-app/FunctionSys/FunctionSys.apk=com.tct.secretCode

$ adb pull /system/priv-app/FunctionSys/FunctionSys.apk
```

## Opening Packages

APKs are just zip files, so you can unzip them - but I used `apktool` to read the AndroidManifest.xml, and a combination of `dex2jar` and `jd-gui` to "decompile" the Java bytecode into Java source.  Doing so, I identified the following in the first app I pulled:

```
private static final String TF_SIMLOCK_LOCK_CODE = "835625";
private static final String TF_SIMLOCK_LOCK_CODE_NEW = "#835625#";
private static final String TF_SIMLOCK_PORT_CODE = "#8376785625#";
private static final String TF_SIMLOCK_STATUS_CODE = "#83782887#";
private static final String TF_SIMLOCK_UNLOCK_CODE = "#83865625#";
```

These didn't all pan out, and the ones that did warrant more research, but that covers the scope of this gist!