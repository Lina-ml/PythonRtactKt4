import { useEffect, useState } from "react";

const CURRENCIES = ["USD", "GBP", "CHF","ILS","CAD" ];

export default function App() {
  const [status, setStatus] = useState("Подключение...");
  const [rates, setRates] = useState(null); 
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource("/events");

    eventSource.onopen = () => {
      setStatus("Подключено к SSE");
      setError(null);
    };

    eventSource.addEventListener("currency_update", (event) => {
      setRates(JSON.parse(event.data));
      setStatus("Подключено к SSE");
      setError(null);
    });

    eventSource.addEventListener("error", (event) => {
      if (event.data) setError(JSON.parse(event.data).message);
    });

    eventSource.onerror = () => {
      setStatus("Нет соединения");
      setError("Соединение потеряно. Переподключение...");
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="page">
      <h1>Курсы валют</h1>
      <p className={error ? "status status--error" : "status"}>{status}</p>
      {error && <p className="error" role="alert">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Валюта</th>
            <th>Курс к EUR</th>
          </tr>
        </thead>
        <tbody>
          {CURRENCIES.map((c) => (
            <tr key={c}>
              <td>{c}</td>
              <td>{rates?.rates?.[c] ?? "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        Последнее обновление:{" "}
        {rates?.updated_at ? new Date(rates.updated_at).toLocaleTimeString() : "--"}
      </p>
    </div>
  );
}
