const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Ruta para recibir notificaciones de Mercado Pago
app.post('/notificaciones-mercadopago', (req, res) => {
  // Aquí maneja la lógica de las notificaciones de Mercado Pago
  console.log('Notificación recibida:', req.body);
  res.status(200).send('Notificación recibida');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
