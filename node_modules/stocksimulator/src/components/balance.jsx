import React, { useState, useEffect } from "react";

export const BalanceBar = () => {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("token"); //assumes the token is stored in localStorage

        if (!token) {
          setError("User not authenticated.");
          return;
        }

        const response = await fetch("http://localhost:5069/get-balance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, //include the token in the Authorization header
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch balance.");
          return;
        }

        const data = await response.json();
        setBalance(data.balance);
      } catch (err) {
        setError("An error occurred while fetching balance.");
      }
    };

    fetchBalance();
  }, []);

  return (
    <div>
      {error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : balance !== null ? (
        <p>Your Current Balance: ${balance.toFixed(2)}</p>
      ) : (
        <p>Loading balance...</p>
      )}
    </div>
  );
};
