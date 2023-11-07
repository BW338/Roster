import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({accessToken: 'APP_USR-8872934073691114-102708-953dde4305634bd631f97f36df2e4564-127395250'});

const preference = new Preference(client);

preference.create({
    'items': [
       {
       'title': 'Meu produto',
       'quantity': 1,
       'currency_id': 'BRL',
       'unit_price': 100
       }
    ]
  }).then((result) => console.log(result))
      .catch((error) => console.log(error));