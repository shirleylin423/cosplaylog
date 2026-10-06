import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { THEMES, THEME_ORDER } from "../themes";

import {
  createRecord as apiCreateRecord,
  deleteRecord as apiDeleteRecord,
  getCurrentUser,
  getRecords,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  updateRecord as apiUpdateRecord,
} from "../api";

import { DEFAULT_SHOOT_TYPES } from "../mock";


const AppContext = createContext(null);

const LS_THEME = "stir-diary:theme";
const LS_TYPES = "stir-diary:types";


function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (raw == null) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}


export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [records, setRecords] = useState([]);

  const [themeKey, setThemeKey] = useState(() => {
    const savedTheme = loadLS(
      LS_THEME,
      "tarot"
    );

    return THEME_ORDER.includes(savedTheme)
      ? savedTheme
      : "tarot";
  });

  const [shootTypes, setShootTypes] = useState(() =>
    loadLS(
      LS_TYPES,
      DEFAULT_SHOOT_TYPES
    )
  );


  // ========================================
  // Authentication
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const currentUser =
          await getCurrentUser();

        if (cancelled) {
          return;
        }

        setUser(currentUser);

        const userRecords =
          await getRecords();

        if (!cancelled) {
          setRecords(userRecords);
        }
      } catch (error) {
        if (!cancelled) {
          setUser(null);
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);


  async function login(username, password) {
    const loggedInUser =
      await apiLogin(
        username,
        password
      );

    setUser(loggedInUser);

    const userRecords =
      await getRecords();

    setRecords(userRecords);

    return loggedInUser;
  }


  async function register(username, password) {
  return apiRegister(
    username,
    password
  );
}


  async function logout() {
    await apiLogout();

    setUser(null);
    setRecords([]);
  }


  // ========================================
  // Records
  // ========================================

  async function addRecord(record) {
    if (!user) {
      throw new Error(
        "Please login first"
      );
    }

    const created =
      await apiCreateRecord(record);

    setRecords((previous) => [
      created,
      ...previous,
    ]);

    return created.id;
  }


  async function updateRecord(id, patch) {
    if (!user) {
      throw new Error(
        "Please login first"
      );
    }

    const updated =
      await apiUpdateRecord(
        id,
        patch
      );

    setRecords((previous) =>
      previous.map((record) =>
        record.id === id
          ? updated
          : record
      )
    );

    return updated;
  }


  async function deleteRecord(id) {
    if (!user) {
      throw new Error(
        "Please login first"
      );
    }

    await apiDeleteRecord(id);

    setRecords((previous) =>
      previous.filter(
        (record) =>
          record.id !== id
      )
    );
  }


  // ========================================
  // Shoot types
  // ========================================

  function addShootType(type) {
    const value =
      (type || "").trim();

    if (!value) {
      return;
    }

    setShootTypes((previous) =>
      previous.includes(value)
        ? previous
        : [...previous, value]
    );
  }


  // ========================================
  // Local settings
  // ========================================

  useEffect(() => {
    localStorage.setItem(
      LS_THEME,
      JSON.stringify(themeKey)
    );
  }, [themeKey]);


  useEffect(() => {
    localStorage.setItem(
      LS_TYPES,
      JSON.stringify(shootTypes)
    );
  }, [shootTypes]);


  // ========================================
  // Theme
  // ========================================

  useEffect(() => {
    const theme =
      THEMES[themeKey];

    if (!theme) {
      return;
    }

    const root =
      document.documentElement;

    Object.entries(theme.vars).forEach(
      ([key, value]) => {
        root.style.setProperty(
          key,
          value
        );
      }
    );

    root.setAttribute(
      "data-theme",
      themeKey
    );

    root.setAttribute(
      "data-dark",
      theme.dark
        ? "true"
        : "false"
    );
  }, [themeKey]);


  const theme =
    THEMES[themeKey];


  // ========================================
  // Record type colors
  // ========================================

  const typeColorMap = useMemo(() => {
    const map = {};

    shootTypes.forEach(
      (type, index) => {
        map[type] =
          theme.typeColors[
            index %
              theme.typeColors.length
          ];
      }
    );

    return map;
  }, [shootTypes, theme]);


  // ========================================
  // Context value
  // ========================================

  const value = {
    // Authentication
    user,
    authLoading,
    login,
    register,
    logout,

    // Records
    records,
    addRecord,
    updateRecord,
    deleteRecord,

    // Shoot types
    shootTypes,
    addShootType,

    // Theme
    themeKey,
    setThemeKey,
    theme,
    THEMES,
    THEME_ORDER,

    // Colors
    typeColorMap,
  };


  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used within AppProvider"
    );
  }

  return context;
}
