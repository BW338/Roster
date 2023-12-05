import { ACCESS_TOKEN } from "./config.json";

export const handleIntegrationMP = async () => {
  const preferencia = {
    binart_mode: true,

    items: [
      {
        title: "SKY ROSTER - acceso anual",
        description: "Podrás descargar y acceder a todos los detalles de tu actividad durante 1 año.",
        picture_url: "https://www.google.com/search?q=plane+sky&tbm=isch&ved=2ahUKEwiFv-WWk7mCAxVhR7gEHX9FB3oQ2-cCegQIABAA&oq=plane+sky&gs_lcp=CgNpbWcQAzIECCMQJzIFCAAQgAQyBAgAEB4yBAgAEB4yBAgAEB4yBAgAEB4yBAgAEB4yBAgAEB4yBAgAEB4yBAgAEB46BwgAEIoFEEM6CggAEIoFELEDEENQ2CxYgEFg8kVoAHAAeACAAeMEiAGyEpIBCTAuOC4yLjUtMZgBAKABAaoBC2d3cy13aXotaW1nwAEB&sclient=img&ei=BvxNZYWkG-GO4dUP_4qd0Ac&bih=851&biw=1592&rlz=1C1CHZN_esAR966AR966#imgrc=6c4HXjm61jYAHM",
        category_id: "Suscripcion",
        quantity: 1,
        currency_id: "$",
        unit_price: 1,
      },
    ],
  };

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", { 
    method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencia),
    });

    const data = await response.json();
    console.log('DATA:', JSON.stringify(data, null, 2));
  //  const preference_id = data.id
    return { init_point: data.init_point,  preference_id: data.id};
  } catch (error) {
    console.log(error);
    return null;
  }
};
