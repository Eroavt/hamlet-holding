// Vorschau-Server für die statische Seite in fk-bausanierung/.
// Der Port kommt aus der Umgebungsvariablen PORT, damit sich mehrere
// Sitzungen nicht gegenseitig blockieren.
export default {
  root: 'fk-bausanierung',
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5175,
    strictPort: false
  }
};
