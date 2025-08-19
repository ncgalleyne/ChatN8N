import React, { useState, useRef } from "react";
import { SafeAreaView, View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from "react-native";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

function ConnectScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectToServer = async () => {
    try {
      setIsConnecting(true);
      const response = await axios.post(serverUrl, { chatInput: { message: "Ping" } }, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        navigation.navigate("Chat", { serverUrl });
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, styles.connectBg]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      >
        <View style={styles.connectContent}>
          <Text style={styles.connectTitle}>Connect to Server</Text>

          <View style={styles.illustrationWrap}>
            {/* Optional illustration. If you provide an asset, drop it into an assets/ folder and update the require path below. */}
            {/* <Image source={require("./assets/connect-illustration.png")} style={styles.illustration} resizeMode="contain" /> */}
            <View style={styles.illustrationPlaceholder} />
          </View>

          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputIcon}>🔗</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter Server URL"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              autoCorrect={false}
              value={serverUrl}
              onChangeText={setServerUrl}
            />
          </View>

          {error && <Text style={styles.errorLight}>{error}</Text>}

          <TouchableOpacity style={styles.connectBtn} onPress={connectToServer} activeOpacity={0.8}>
            {isConnecting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.connectBtnText}>Connect</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <Text style={styles.linkTextDim}>Need help?</Text>
            <Text style={styles.linkText}> Learn more</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatScreen({ route }) {
  const { serverUrl } = route.params;
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { id: Date.now().toString(), sender: "You", text: message };
    setChat((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(serverUrl, { chatInput: { message } }, {
        headers: { "Content-Type": "application/json" },
      });
      const { output } = response.data; 

      const serverMessage = {
        id: Date.now().toString() + "_srv",
        sender: "Server",
        text: output,
      };
      setChat((prev) => [...prev, serverMessage]);
    } catch (err) {
      const errorMsg = { id: Date.now().toString() + "_err", sender: "Error", text: "Failed to send message" };
      setChat((prev) => [...prev, errorMsg]);
    } finally {
      setMessage("");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MCP Chat</Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight + (insets?.bottom || 0) + 32 : 0}
      >
        <View style={styles.chatBox}>
          <FlatList
            ref={flatListRef}
            data={chat}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            inverted
            contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.sender === "You" ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
                <View style={item.sender === "You" ? styles.msgBubbleUser : styles.msgBubbleServer}>
                  <Text>{item.text}</Text>
                </View>
              </View>
            )}
          />
          {loading && <Text style={styles.loadingText}>Thinking...</Text>}
        </View>

        <View style={[styles.inputRow, { paddingBottom: (insets?.bottom || 8) }] }>
          <TextInput
            style={styles.input}
            placeholder="Ask something..."
            value={message}
            onChangeText={setMessage}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            disabled={loading}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading || !message.trim()}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  // Connect screen styles
  connectBg: { backgroundColor: "#0a1f7a" },
  connectContent: { flex: 1, justifyContent: "space-between", paddingVertical: 24 },
  connectTitle: { fontSize: 32, fontWeight: "700", color: "#ffffff", marginTop: 8 },
  illustrationWrap: { alignItems: "center", marginTop: 8 },
  illustration: { width: "100%", height: 180 },
  illustrationPlaceholder: { width: "100%", height: 180, backgroundColor: "#0f2aa8", borderRadius: 12 },
  inputFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3b5bdb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  inputIcon: { fontSize: 18, color: "#e2e8f0", marginRight: 8 },
  inputField: { flex: 1, color: "#ffffff", fontSize: 16 },
  connectBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  connectBtnText: { color: "#0a1f7a", fontSize: 18, fontWeight: "600" },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  linkTextDim: { color: "#cbd5e1" },
  linkText: { color: "#ffffff", fontWeight: "600" },
  // Shared
  title: { fontSize: 24, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  chatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: "#f9fafb",
  },
  msgRow: { width: "100%", marginVertical: 4 },
  msgBubbleUser: { backgroundColor: "#bfdbfe", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, maxWidth: "85%" },
  msgBubbleServer: { backgroundColor: "#d1fae5", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, maxWidth: "85%" },
  loadingText: { color: "#9ca3af", paddingVertical: 6, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, flex: 1, marginRight: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  error: { color: "red", marginTop: 8 },
  sendBtn: { backgroundColor: "#2563eb", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  sendBtnText: { color: "#ffffff", fontWeight: "600" },
  errorLight: { color: "#fecaca", marginTop: 8 },
});
