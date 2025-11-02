// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Button, SafeAreaView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Purchases from 'react-native-purchases';

const RC_ANDROID_KEY = 'goog_XXXXXXXXXXXXXXXX'; // TODO: paste your RevenueCat Android Public SDK key
const ENTITLEMENT_ID = 'pro';                   // must match your RC entitlement id

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        Purchases.setLogLevel('DEBUG');
        await Purchases.configure({
          apiKey: RC_ANDROID_KEY,
          appUserID: null,
          observerMode: false, // let RevenueCat manage purchase + entitlements
        });
        const offs = await Purchases.getOfferings();
        setOfferings(offs);
      } catch (e) {
        Alert.alert('RevenueCat init failed', e?.message ?? String(e));
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  const purchaseSubscription = useCallback(async (identifier) => {
    try {
      setLoadingPurchase(true);

      const offs = offerings || (await Purchases.getOfferings());
      const current = offs?.current;
      if (!current) {
        Alert.alert('No offering', 'Set a Current offering in RevenueCat with packages "monthly" and "yearly".');
        return;
      }
      const pkg = current.availablePackages?.find(p => p.identifier === identifier);
      if (!pkg) {
        Alert.alert('No package', `Package "${identifier}" not found in the Current offering.`);
        return;
      }

      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);

      if (customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]) {
        Alert.alert('Success', `You now have ${ENTITLEMENT_ID.toUpperCase()} access.\n(${productIdentifier})`);
      } else {
        Alert.alert('Purchased', 'Purchase completed but entitlement not active yet.');
      }
    } catch (e) {
      if (e?.userCancelled) return;
      Alert.alert('Purchase failed', e?.message ?? 'Unknown error');
    } finally {
      setLoadingPurchase(false);
    }
  }, [offerings]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose Your Plan!</Text>

      {!isReady ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.buttonWrapper}>
            <Button
              title="Monthly $4.99"
              disabled={loadingPurchase}
              onPress={() => purchaseSubscription('monthly')}
            />
          </View>

          <View style={styles.buttonWrapper}>
            <Button
              title="Yearly $29.99"
              disabled={loadingPurchase}
              onPress={() => purchaseSubscription('yearly')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, marginBottom: 20, fontWeight: '600' },
  buttonWrapper: { marginVertical: 10, width: 240 }
});
