import React, { useEffect, useState } from 'react';

const Context = React.createContext();

function ContextProvider({ children }) {
  const [data, setData] = useState([]); // First data source
  const [aiData, setAiData] = useState([]); // Second data source for AI
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  const [language, setLanguage] = useState(() => {
    // language auswahl funktion
    const saved = localStorage.getItem("lang");
    if (!saved) {
      localStorage.setItem("lang", "de");
      return "de";
    }
    return saved;
  });

  // Function to change language (can be used in a button etc.)
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
    console.log(lang);
  };

  useEffect(() => {
    // Fetch first data file
    const getData = async () => {
      
   // const url = `${process.env.PUBLIC_URL}./locales/data2-${language}.json`;
      const url = `./locales/data2-${language}.json`;
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setData([]); // Set fallback data
      } finally {
        setLoading(false);
      }
    };

    // Fetch second data file (AI data)
    const getAiData = async () => {
      const url = `/locales/data-${language}-ai.json`;
      try {
        setAiLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const jsonData = await response.json();
        setAiData(jsonData);
      } catch (error) {
        console.error("Failed to fetch AI data:", error);
        setAiData([]); // Set fallback data
      } finally {
        setAiLoading(false);
      }
    };

    // Fetch both data sources
    getData();
    getAiData();
  }, [language]);

  

  const contextValue = {
    data,           // First data source: data2-${language}.json
    aiData,         // Second data source: data-${language}-ai.json
    language,
    changeLanguage,
    loading,        // Loading state for first data
    aiLoading,      // Loading state for AI data
    isLoading: loading || aiLoading // Combined loading state
  };

  return (
    <Context.Provider value={{ data, aiData, language, changeLanguage}}>
      {children}
    </Context.Provider>
  );
}

export { Context, ContextProvider};