export default function RetroFooter() {
  return (
    <div className="retro-footer">
      <p>© 2012-2015 Basta Market — All transactions in Litecoin (LTC)</p>
      <p style={{ marginTop: 4 }}>
        Escrow Protected | PGP Encouraged | No Logs | 
        <span className="retro-blink" style={{ color: "hsl(120,70%,45%)", marginLeft: 4 }}>●</span> Server Status: ONLINE
      </p>
      <p style={{ marginTop: 4, fontSize: 9 }}>
        bastamarket.xyz — For demo/educational purposes only
      </p>
    </div>
  );
}
