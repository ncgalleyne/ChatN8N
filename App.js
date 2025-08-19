import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function ConnectScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState(null);

  const connectToServer = async () => {
    try {
      const response = await axios.post(serverUrl, { chatInput: { message: "Ping" } }, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        navigation.navigate("Chat", { serverUrl });
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Enter Server URL:</Text>
      <TextInput
        style={styles.input}
        placeholder=""
        value={serverUrl}
        onChangeText={setServerUrl}
      />
      <Button title="Connect" onPress={connectToServer} />
      {error && <Text style={styles.error}>{error}</Text>}
    </SafeAreaView>
  );
}

function ChatScreen({ route }) {
  const { serverUrl } = route.params;
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { id: Date.now().toString(), sender: "You", text: message };
    setChat((prev) => [...prev, userMessage]);

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
    }

    setMessage("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chat}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={item.sender === "You" ? styles.userMsg : styles.serverMsg}>
            {item.sender}: {item.text}
          </Text>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
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
  label: { fontSize: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, flex: 1, marginRight: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  userMsg: { alignSelf: "flex-end", backgroundColor: "#d1f7c4", padding: 8, borderRadius: 6, marginVertical: 2 },
  serverMsg: { alignSelf: "flex-start", backgroundColor: "#f0f0f0", padding: 8, borderRadius: 6, marginVertical: 2 },
  error: { color: "red", marginTop: 8 },
});
