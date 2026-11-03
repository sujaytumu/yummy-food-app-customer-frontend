package com.sujaytumu.yummy;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // plugins must be registered before super.onCreate
        registerPlugin(RazorpayCheckoutPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
