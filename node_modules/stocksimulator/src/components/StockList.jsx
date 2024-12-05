import React, {useState,useEffect} from "react";
import "../styling/list.css";


export const StockList = ({userId}) =>{

    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      // Function to fetch user-owned stocks
      const fetchStocks = async () => {
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:5069/user-stocks/${userId}`);
          
          // Check for errors in the response
          if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          }
  
          const data = await response.json();
          setStocks(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchStocks();
    }, [userId]);
  
    if (loading) {
      return <p>Loading...</p>;
    }
  
    if (error) {
      return <p>Error: {error}</p>;
    }
  
    return (
      <div>
        <h2>Stocks Owned by User {userId}</h2>
        {stocks.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Stock Symbol</th>
                <th>Company Name</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => (
                <tr key={stock.stock_id}>
                  <td>{stock.stock_symbol}</td>
                  <td>{stock.company_name}</td>
                  <td>{stock.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No stocks owned.</p>
        )}
      </div>
    );
}
