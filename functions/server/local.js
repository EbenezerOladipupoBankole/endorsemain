// Plain Node entry point for Render, Railway, a VPS or local testing: `npm run server`.
const app = require("./app.js");
const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`Endorse API listening on port ${port}`));
