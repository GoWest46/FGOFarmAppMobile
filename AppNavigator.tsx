import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeamSetupScreen from "./TeamSetupScreen"; // 💡 Aqui tem que ser o arquivo gigante
import PlayerCommandsScreen from './PlayerCommandsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
        <Stack.Screen 
          name="PlayerCommands" 
          component={PlayerCommandsScreen} 
          options={{ orientation: "landscape" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}