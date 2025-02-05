import React, { useState, useEffect } from "react";
import '../styling/balancebar.css'

export const BalanceBar = ( {userId} ) => {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {

        if (!userId) {
          setError("User ID not found. Please log in.");
          return;
        }

        const response = await fetch(`http://localhost:5069/get-balance/${userId}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch balance.");
          return;
        }

        const data = await response.json();
        setBalance(data.balance);
      } catch (err) {
        setError("An error occurred while fetching the balance.");
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="text">
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
