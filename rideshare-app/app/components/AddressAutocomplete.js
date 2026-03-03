import { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { colors } from "../../ui/styles/colors";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "";

export default function AddressAutocomplete({
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  onSubmitEditing,
  onAddressSelected,
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(generateSessionToken());

  function generateSessionToken() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const fetchSuggestions = useCallback(async (text) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const url =
        `https://api.mapbox.com/search/searchbox/v1/suggest` +
        `?q=${encodeURIComponent(text)}` +
        `&access_token=${MAPBOX_TOKEN}` +
        `&session_token=${sessionTokenRef.current}` +
        `&language=en` +
        `&country=us` +
        `&types=address,place,poi` +
        `&limit=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.warn("Mapbox suggest error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    onChangeText(text);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleSelect = async (suggestion) => {
    try {
      const url =
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}` +
        `?access_token=${MAPBOX_TOKEN}` +
        `&session_token=${sessionTokenRef.current}`;

      const res = await fetch(url);
      const data = await res.json();

      let fullAddress = suggestion.full_address || suggestion.name || "";
      if (
        data.features &&
        data.features.length > 0 &&
        data.features[0].properties
      ) {
        fullAddress =
          data.features[0].properties.full_address ||
          data.features[0].properties.name ||
          fullAddress;
      }

      setQuery(fullAddress);
      onChangeText(fullAddress);
      if (onAddressSelected) onAddressSelected(fullAddress);
    } catch {
      const fallback = suggestion.full_address || suggestion.name || "";
      setQuery(fallback);
      onChangeText(fallback);
      if (onAddressSelected) onAddressSelected(fallback);
    }

    setSuggestions([]);
    setShowSuggestions(false);
    sessionTokenRef.current = generateSessionToken();
  };

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? "search" : "default"}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />

      {loading && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.spinner}
        />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((item, idx) => (
              <TouchableOpacity
                key={item.mapbox_id || String(idx)}
                style={styles.suggestionRow}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.full_address && item.full_address !== item.name && (
                  <Text style={styles.suggestionAddress} numberOfLines={1}>
                    {item.full_address}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  spinner: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  suggestionAddress: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
});
